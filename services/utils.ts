import type { NutritionInfo, AnalyzedFoodItem } from '../types';

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:image/jpeg;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });


// --- Audio Encoding & Decoding for TTS and Live API ---
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudio = async (base64Audio: string, audioContext: AudioContext) => {
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const outputNode = audioContext.createGain();
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1,
    );
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    outputNode.connect(audioContext.destination);
    source.connect(outputNode);
    source.start();
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
};

// --- Nutritional Calculation Utilities ---
export const initialNutrition: Required<NutritionInfo> = {
    calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, waterGoal: 3000, fiber: 0, sugar: 0, sodium: 0, potassium: 0,
    cholesterol: 0, saturatedFat: 0, transFat: 0, calcium: 0, iron: 0, zinc: 0, magnesium: 0,
    phosphorus: 0, manganese: 0, copper: 0, selenium: 0, iodine: 0, vitaminA: 0, vitaminC: 0,
    vitaminD: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0,
    vitaminB5: 0, vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0,
};

export const nutrientMetadata: Record<string, { label: string, unit: string }> = {
    water: { label: "Water", unit: "ml" },
    fiber: { label: "Fiber", unit: "g" },
    sugar: { label: "Sugar", unit: "g" },
    saturatedFat: { label: "Sat. Fat", unit: "g" },
    sodium: { label: "Sodium", unit: "mg" },
    potassium: { label: "Potassium", unit: "mg" },
    cholesterol: { label: "Cholesterol", unit: "mg" },
    calcium: { label: 'Calcium', unit: 'mg' },
    iron: { label: 'Iron', unit: 'mg' },
    zinc: { label: 'Zinc', unit: 'mg' },
    magnesium: { label: 'Magnesium', unit: 'mg' },
    phosphorus: { label: 'Phosphorus', unit: 'mg' },
    manganese: { label: 'Manganese', unit: 'mg' },
    copper: { label: 'Copper', unit: 'mg' },
    selenium: { label: 'Selenium', unit: 'mcg' },
    iodine: { label: 'Iodine', unit: 'mcg' },
    vitaminA: { label: 'Vitamin A', unit: 'mcg' },
    vitaminC: { label: 'Vitamin C', unit: 'mg' },
    vitaminD: { label: 'Vitamin D', unit: 'mcg' },
    vitaminE: { label: 'Vitamin E', unit: 'mg' },
    vitaminK: { label: 'Vitamin K', unit: 'mcg' },
    vitaminB1: { label: 'Vitamin B1', unit: 'mg' },
    vitaminB2: { label: 'Vitamin B2', unit: 'mg' },
    vitaminB3: { label: 'Vitamin B3', unit: 'mg' },
    vitaminB5: { label: 'Vitamin B5', unit: 'mg' },
    vitaminB6: { label: 'Vitamin B6', unit: 'mg' },
    vitaminB7: { label: 'Vitamin B7', unit: 'mcg' },
    vitaminB9: { label: 'Vitamin B9', unit: 'mcg' },
    vitaminB12: { label: 'Vitamin B12', unit: 'mcg' },
};

export const limitNutrients = new Set(['calories', 'carbs', 'fat', 'saturatedFat', 'transFat', 'sugar', 'sodium', 'cholesterol']);

export const calculateTotalNutrition = (items: AnalyzedFoodItem[]): NutritionInfo => {
    return items.reduce((acc, item) => {
        const quantity = item.quantity || 1;
        for (const key in initialNutrition) {
            const nutrientKey = key as keyof NutritionInfo;
            if (typeof (item as any)[nutrientKey] === 'number') {
                acc[nutrientKey] = (acc[nutrientKey] ?? 0) + ((item as any)[nutrientKey]! * quantity);
            }
        }
        return acc;
    }, { ...initialNutrition });
};