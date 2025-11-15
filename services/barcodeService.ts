import type { AnalyzedFoodItem } from '../types';
import { ai } from './geminiService';

/**
 * Fetches product information for a given barcode using AI with Google Search grounding.
 * @param barcode - The barcode string.
 * @returns A promise that resolves to an array of food item information.
 */
export const getFoodItemFromBarcode = async (barcode: string): Promise<AnalyzedFoodItem[]> => {
  console.log(`Looking up barcode with AI: ${barcode}`);
  try {
    const prompt = `Act as a product data specialist. A user has scanned a barcode (UPC/EAN/etc.): "${barcode}".
Use Google Search to find this product.
- If it is a food or drink item, provide a detailed nutritional analysis for a standard serving size, including all available nutrients (name, calories, protein, carbs, fat, vitamins, minerals, etc.).
- If it is not a food item, identify the product's name but set all nutritional values to 0.
- Your entire response MUST be only a valid JSON array. If the product is found, the array should contain a single JSON object with the product's details.
- If the product cannot be found, you MUST return an empty JSON array: [].
- Do not add any text or markdown formatting before or after the JSON array.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonString = response.text.trim();
    
    // The model may still wrap the JSON in markdown backticks despite instructions
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }
    
    if (!jsonString || jsonString === '[]') {
      return [];
    }
    
    const result = JSON.parse(jsonString);
    
    // Additional validation in case the model returns something unexpected
    if (!Array.isArray(result)) {
        console.warn("Barcode lookup returned non-array:", result);
        return [];
    }
    if (result.length > 0 && typeof result[0].name !== 'string') {
        console.warn("Barcode lookup returned invalid item:", result[0]);
        return [];
    }

    return result as AnalyzedFoodItem[];

  } catch (error) {
    console.error("Error looking up barcode with AI:", error);
    // Return empty array on error to be handled by the caller
    return [];
  }
};
