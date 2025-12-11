import { GoogleGenAI, Type } from "@google/genai";
import { PhoneSpecs } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Get phone screen resolution
export const getPhoneSpecs = async (modelName: string): Promise<PhoneSpecs> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the smartphone model from this input string: "${modelName}". 
      
      Rules:
      1. If the input is a browser User Agent string (contains 'Mozilla', 'AppleWebKit', etc.), try to extract the specific mobile device model (e.g. 'iPhone', 'SM-S901B').
      2. If the User Agent indicates a Desktop or unknown generic browser, assume the device is "iPhone 15 Pro".
      3. If the input is a direct model name (e.g. "Pixel 8"), use it directly.
      
      Return the exact screen resolution width and height in pixels for the identified device.
      If there are multiple versions (like standard/Pro/Max), assume the standard version unless specified.
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            width: { type: Type.INTEGER, description: "Screen width in pixels" },
            height: { type: Type.INTEGER, description: "Screen height in pixels" },
            officialName: { type: Type.STRING, description: "The official name of the device identified" }
          },
          required: ["width", "height", "officialName"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      name: data.officialName || "Smartphone",
      width: data.width || 1080,
      height: data.height || 2400
    };
  } catch (error) {
    console.error("Error fetching phone specs:", error);
    // Fallback defaults
    return { name: "Smartphone", width: 1080, height: 1920 };
  }
};

// Generate wallpaper image
export const generateWallpaper = async (query: string, style: string = 'Default', context: string = ''): Promise<string | null> => {
  try {
    // Construct refined prompt based on filters
    let stylePrompt = "A high-quality, photorealistic portrait or artistic wallpaper";
    if (style === 'Professional Studio') stylePrompt = "A high-end professional studio photography portrait";
    if (style === 'Candid Shot') stylePrompt = "A high-quality candid street-style photography shot";
    if (style === 'Movie Still') stylePrompt = "A cinematic movie still";
    if (style === 'Red Carpet') stylePrompt = "A high-quality red carpet event photography shot";

    const contextPrompt = context.trim() ? `appearing as seen in or inspired by "${context}"` : "";

    const fullPrompt = `${stylePrompt} of ${query} ${contextPrompt}. 
    Professional lighting, 4k resolution, aesthetically pleasing, suitable for a phone wallpaper. 
    Keep the subject centered to allow for cropping.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: fullPrompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Square allows flexibility for both portrait and landscape crops
          // imageSize is not supported for gemini-2.5-flash-image
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};