import React, { useState, useCallback } from 'react';
import {
  MapPin,
  Search,
  Download,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  Filter,
  Building2,
  Info,
} from 'lucide-react';
import {
  Lead,
  searchBusinessesWithoutWebsite,
  exportToCSV,
  buildGoogleSheetsTabData,
} from '../services/leadGenerator';

interface LeadGeneratorToolProps {
  userCountry?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Fast Food',
  food_court: 'Food Court',
  ice_cream: 'Ice Cream',
  bakery: 'Bakery',
  hotel: 'Hotel',
  motel: 'Motel',
  hostel: 'Hostel',
  guest_house: 'Guest House',
  chalet: 'Chalet',
  apartment: 'Apartment',
  camp_site: 'Camp Site',
  beauty: 'Beauty Salon',
  hairdresser: 'Hairdresser',
  barber: 'Barber',
  clothes: 'Clothing Store',
  shoes: 'Shoe Store',
  jewelry: 'Jewelry',
  electronics: 'Electronics',
  supermarket: 'Supermarket',
  convenience: 'Convenience Store',
  butcher: 'Butcher',
  florist: 'Florist',
  gift: 'Gift Shop',
  books: 'Bookstore',
  sports: 'Sports Store',
  furniture: 'Furniture',
  hardware: 'Hardware',
  car_repair: 'Auto Repair',
  car_parts: 'Auto Parts',
  dry_cleaning: 'Dry Cleaning',
  laundry: 'Laundry',
  travel_agency: 'Travel Agency',
  estate_agent: 'Real Estate',
  lawyer: 'Law Office',
  accountant: 'Accounting',
  insurance: 'Insurance',
  financial: 'Financial',
  it: 'IT Services',
  copyshop: 'Copy Shop',
  fitness_centre: 'Gym / Fitness',
  sports_centre: 'Sports Centre',
  dance: 'Dance Studio',
  spa: 'Spa',
  massage: 'Massage',
  tattoo: 'Tattoo Studio',
  optician: 'Optician',
  medical_supply: 'Medical Supply',
  pet: 'Pet Store',
  veterinary: 'Veterinary',
  photo: 'Photography',
  art: 'Art Gallery',
  music: 'Music Store',
  toys: 'Toy Store',
  bicycle: 'Bicycle Shop',
  mobile_phone: 'Mobile Phone',
  stationery: 'Stationery',
  tailor: 'Tailor',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  plumber: 'Plumber',
  painter: 'Painter',
  escape_game: 'Escape Room',
  amusement_arcade: 'Arcade',
  business: 'Business',
};

function getCategoryLabel(cat: string): string {
  return (
    CATEGORY_LABELS[cat] ||
    cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

export function LeadGeneratorTool({ userCountry = '' }: LeadGeneratorToolProps) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState(userCountry);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [copiedSheets, setCopiedSheets] = useState(false);
  const [searchedCity, setSearchedCity] = useState('');
  const [searchedCountry, setSearchedCountry] = useState('');

  const handleSearch = useCallback(async () => {
    const trimCity = city.trim();
    const trimCountry = country.trim();
    if (!trimCity || !trimCountry) return;

    setStatus('loading');
    setLeads([]);
    setErrorMsg('');
    setFilterCategory('all');
    setSearchedCity(trimCity);
    setSearchedCountry(trimCountry);

    try {
      const results = await searchBusinessesWithoutWebsite(
        trimCity,
        trimCountry,
        (msg) => setProgressMsg(msg)
      );
      setLeads(results);
      setStatus('done');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
      setStatus('error');
    }
  }, [city, country]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCopyForSheets = async () => {
    const text = buildGoogleSheetsTabData(filteredLeads);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSheets(true);
      setTimeout(() => setCopiedSheets(false), 2500);
    } catch {
      // Fallback for browsers that restrict clipboard
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSheets(true);
      setTimeout(() => setCopiedSheets(false), 2500);
    }
  };

  const categories = leads.length > 0
    ? ['all', ...Array.from(new Set(leads.map((l) => l.category))).sort()]
    : ['all'];

  const filteredLeads =
    filterCategory === 'all'
      ? leads
      : leads.filter((l) => l.category === filterCategory);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-purple-900/40 border border-purple-700/40">
            <Globe className="text-purple-400" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-white">Website Lead Generator</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Discover local businesses without a website — generate your outreach leads list instantly
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
              City
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="e.g. Paris, New York, Lagos"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={status === 'loading'}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
              Country
            </label>
            <input
              type="text"
              placeholder="e.g. France, United States, Nigeria"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status === 'loading'}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-60"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={status === 'loading' || !city.trim() || !country.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30"
            >
              {status === 'loading' ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {status === 'loading' ? 'Searching...' : 'Find Leads'}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2 mt-4 pt-4 border-t border-slate-700/60">
          <Info size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-slate-500 text-xs leading-relaxed">
            Queries the OpenStreetMap Overpass API for businesses in the specified city that have
            no website listed. Results can be exported to Excel (.csv) or pasted directly into
            Google Sheets.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="text-center py-16">
          <div className="relative inline-block mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
          <p className="text-slate-300 font-medium">{progressMsg || 'Searching...'}</p>
          <p className="text-slate-600 text-sm mt-1.5">
            Large cities may take up to 30 seconds
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/60 rounded-xl p-4">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium text-sm">Search failed</p>
            <p className="text-red-400/80 text-sm mt-0.5">{errorMsg}</p>
            <button
              onClick={handleSearch}
              className="mt-2 text-xs text-red-300 hover:text-red-200 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <>
          {/* Summary + export bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-white font-semibold">
                  <span className="text-purple-400">{leads.length}</span> businesses found
                  without a website
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5 ml-6">
                in {searchedCity}, {searchedCountry}
              </p>
            </div>

            {leads.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyForSheets}
                  title="Copy tab-separated values — paste into Google Sheets"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  {copiedSheets ? (
                    <CheckCircle size={13} className="text-green-400" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copiedSheets ? 'Copied!' : 'Copy for Google Sheets'}
                </button>
                <button
                  onClick={() => exportToCSV(filteredLeads, searchedCity, searchedCountry)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-16">
              <Building2 size={40} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-400">No unwebsited businesses found in this area.</p>
              <p className="text-slate-600 text-sm mt-1">
                Try a different city name or check the spelling.
              </p>
            </div>
          ) : (
            <>
              {/* Category filter pills */}
              {categories.length > 2 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                  <Filter size={13} className="text-slate-500 flex-shrink-0" />
                  {categories.map((cat) => {
                    const count =
                      cat === 'all'
                        ? leads.length
                        : leads.filter((l) => l.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filterCategory === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {cat === 'all' ? 'All' : getCategoryLabel(cat)}{' '}
                        <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Results table */}
              <div className="overflow-x-auto rounded-xl border border-slate-700/80 shadow-xl">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-400 text-left">
                      <th className="px-4 py-3 font-medium text-xs w-10">#</th>
                      <th className="px-4 py-3 font-medium text-xs">Business Name</th>
                      <th className="px-4 py-3 font-medium text-xs">Category</th>
                      <th className="px-4 py-3 font-medium text-xs">Address</th>
                      <th className="px-4 py-3 font-medium text-xs">Contact</th>
                      <th className="px-4 py-3 font-medium text-xs">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, i) => (
                      <tr
                        key={lead.id}
                        className={`border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                          i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/10'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                          <span className="block truncate" title={lead.name}>
                            {lead.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 bg-purple-900/30 border border-purple-800/40 text-purple-300 rounded-md text-xs whitespace-nowrap">
                            {getCategoryLabel(lead.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px]">
                          <span className="block truncate" title={lead.address}>
                            {lead.address}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-xs transition-colors"
                              >
                                <Phone size={10} className="flex-shrink-0" />
                                <span className="truncate max-w-[120px]">{lead.phone}</span>
                              </a>
                            ) : null}
                            {lead.email ? (
                              <a
                                href={`mailto:${lead.email}`}
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-xs transition-colors"
                              >
                                <Mail size={10} className="flex-shrink-0" />
                                <span className="truncate max-w-[120px]">{lead.email}</span>
                              </a>
                            ) : null}
                            {!lead.phone && !lead.email && (
                              <span className="text-slate-700 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <a
                              href={lead.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                            >
                              Maps
                              <ExternalLink size={10} />
                            </a>
                            <a
                              href={lead.openStreetMapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-400 transition-colors whitespace-nowrap"
                            >
                              OSM
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer tip */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-slate-600 text-xs">
                  Showing {filteredLeads.length} of {leads.length} leads
                </p>
                <p className="text-slate-600 text-xs">
                  Export CSV → open in Excel &nbsp;·&nbsp; or Copy for Sheets → paste into Google Sheets (Ctrl+V)
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
