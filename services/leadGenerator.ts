export interface Lead {
  id: string;
  name: string;
  osmType: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  googleMapsLink: string;
  openStreetMapLink: string;
  pitchStatus: 'New' | 'Contacted' | 'In Progress' | 'Closed Won' | 'Closed Lost';
  notes: string;
}

interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface NominatimResult {
  display_name: string;
  boundingbox: [string, string, string, string]; // [minLat, maxLat, minLon, maxLon]
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
  type: string;
  class: string;
}

// Amenities that are not commercial establishments
const EXCLUDED_CATEGORIES = new Set([
  'parking', 'parking_space', 'parking_entrance', 'bench', 'waste_basket',
  'waste_disposal', 'waste_transfer_station', 'toilets', 'post_box',
  'vending_machine', 'atm', 'fuel', 'bus_station', 'bus_stop', 'taxi',
  'bicycle_parking', 'car_wash', 'shelter', 'drinking_water', 'fountain',
  'place_of_worship', 'recycling', 'fire_station', 'police', 'post_office',
  'library', 'community_centre', 'social_facility', 'kindergarten', 'school',
  'university', 'college', 'hospital', 'clinic', 'doctors', 'dentist',
  'pharmacy', 'grave_yard', 'crematorium', 'charging_station', 'telephone',
  'bicycle_rental', 'car_sharing', 'motorcycle_parking', 'loading_dock',
  'marketplace', 'ferry_terminal', 'stripclub', 'brothel', 'swingerclub',
]);

export async function geocodeCity(
  city: string,
  country: string
): Promise<NominatimResult | null> {
  const q = encodeURIComponent(`${city}, ${country}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=10`;

  const resp = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'PicloreLeadGenerator/1.0 (contact@piclore.ai)',
    },
  });

  if (!resp.ok) throw new Error('Failed to geocode city. Check your internet connection.');

  const results: NominatimResult[] = await resp.json();

  if (!results.length) return null;

  // Prefer admin boundaries (relations) — they have accurate bounding boxes
  const adminBoundary = results.find(
    (r) =>
      r.osm_type === 'relation' &&
      (r.class === 'boundary' || r.class === 'place') &&
      (r.type === 'administrative' || r.type === 'city' || r.type === 'town')
  );

  return adminBoundary || results[0];
}

export async function searchBusinessesWithoutWebsite(
  city: string,
  country: string,
  onProgress?: (msg: string) => void
): Promise<Lead[]> {
  onProgress?.(`Locating ${city}, ${country} on the map...`);

  const nominatimResult = await geocodeCity(city, country);
  if (!nominatimResult) {
    throw new Error(
      `Could not find "${city}, ${country}" on the map. Please check the spelling and try again.`
    );
  }

  // Nominatim boundingbox: [minLat, maxLat, minLon, maxLon]
  const [minLat, maxLat, minLon, maxLon] = nominatimResult.boundingbox;

  // Overpass bbox format: south,west,north,east = minLat,minLon,maxLat,maxLon
  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

  onProgress?.('Querying OpenStreetMap for businesses without websites...');

  // Exclude common non-commercial amenities inline in the regex
  const excludeRegex =
    'parking|parking_space|parking_entrance|bench|waste_basket|waste_disposal|toilets|post_box|vending_machine|atm|fuel|bus_stop|bus_station|bicycle_parking|shelter|drinking_water|fountain|place_of_worship|recycling|fire_station|police|post_office|library|community_centre|social_facility|kindergarten|school|university|college|hospital|clinic|doctors|dentist|pharmacy|grave_yard|crematorium|charging_station|telephone|bicycle_rental|motorcycle_parking';

  const query = `
[out:json][timeout:90][bbox:${bbox}];
(
  node["name"][!"website"]["amenity"]["amenity"!~"${excludeRegex}"];
  node["name"][!"website"]["shop"];
  node["name"][!"website"]["tourism"~"hotel|motel|hostel|guest_house|chalet|apartment|camp_site|caravan_site"];
  node["name"][!"website"]["office"];
  node["name"][!"website"]["craft"];
  node["name"][!"website"]["leisure"~"fitness_centre|sports_centre|dance|escape_game|amusement_arcade"];
  way["name"][!"website"]["amenity"]["amenity"!~"${excludeRegex}"];
  way["name"][!"website"]["shop"];
  way["name"][!"website"]["tourism"~"hotel|motel|hostel|guest_house|chalet|apartment|camp_site|caravan_site"];
  way["name"][!"website"]["office"];
  way["name"][!"website"]["craft"];
  way["name"][!"website"]["leisure"~"fitness_centre|sports_centre|dance|escape_game|amusement_arcade"];
);
out body center qt 1000;
  `.trim();

  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    if (text.includes('rate_limited') || resp.status === 429) {
      throw new Error(
        'OpenStreetMap is temporarily rate-limited. Please wait a minute and try again.'
      );
    }
    throw new Error('Failed to query the OpenStreetMap database. Please try again.');
  }

  const data = await resp.json();
  const elements: OsmElement[] = data.elements || [];

  onProgress?.(`Processing ${elements.length} establishments...`);

  const seen = new Set<string>();
  const leads: Lead[] = [];

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name?.trim();
    if (!name) continue;

    // Deduplicate by name + rough coordinates
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    const dedupeKey = `${name}-${lat.toFixed(3)}-${lng.toFixed(3)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const category =
      tags.amenity ||
      tags.shop ||
      tags.tourism ||
      tags.office ||
      tags.craft ||
      tags.leisure ||
      'business';

    if (EXCLUDED_CATEGORIES.has(category)) continue;

    const addressParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:suburb'],
      tags['addr:city'] || city,
      tags['addr:postcode'],
      country,
    ].filter(Boolean);

    const address =
      addressParts.length > 2
        ? addressParts.join(', ')
        : `${city}, ${country}`;

    leads.push({
      id: `${el.type}-${el.id}`,
      name,
      osmType: el.type,
      category,
      address,
      phone: tags.phone || tags['contact:phone'] || tags['phone:mobile'] || '',
      email: tags.email || tags['contact:email'] || '',
      lat,
      lng,
      googleMapsLink: `https://maps.google.com/?q=${lat},${lng}`,
      openStreetMapLink: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      pitchStatus: 'New',
      notes: `No website found in OpenStreetMap as of ${new Date().toLocaleDateString()}. Category: ${category}.`,
    });
  }

  return leads;
}

export function exportToCSV(leads: Lead[], city: string, country: string): void {
  const headers = [
    'Business Name',
    'Category',
    'Address',
    'Phone',
    'Email',
    'Google Maps',
    'OpenStreetMap Link',
    'Pitch Status',
    'Notes',
  ];

  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = leads.map((lead) =>
    [
      escapeCell(lead.name),
      escapeCell(lead.category),
      escapeCell(lead.address),
      escapeCell(lead.phone),
      escapeCell(lead.email),
      escapeCell(lead.googleMapsLink),
      escapeCell(lead.openStreetMapLink),
      escapeCell(lead.pitchStatus),
      escapeCell(lead.notes),
    ].join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${city.toLowerCase().replace(/\s+/g, '-')}-${country
    .toLowerCase()
    .replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildGoogleSheetsTabData(leads: Lead[]): string {
  const headers = [
    'Business Name',
    'Category',
    'Address',
    'Phone',
    'Email',
    'Google Maps',
    'OpenStreetMap Link',
    'Pitch Status',
    'Notes',
  ];
  const rows = leads.map((l) => [
    l.name,
    l.category,
    l.address,
    l.phone,
    l.email,
    l.googleMapsLink,
    l.openStreetMapLink,
    l.pitchStatus,
    l.notes,
  ]);
  return [headers, ...rows].map((r) => r.join('\t')).join('\n');
}
