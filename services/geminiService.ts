import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { AnalyzedFoodItem, UserProfile, NutritionInfo, AnalyzedProduct, GoalSuggestion, MealSuggestion, WeeklyInsight, Meal, Recipe, Exercise, DailyInsight, AntiNutrient } from '../types';

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const antiNutrientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Name of the anti-nutrient (e.g., Oxalates).' },
    description: { type: Type.STRING, description: 'A brief, simple explanation of its effect (e.g., "Can reduce calcium absorption").' },
  },
  required: ['name', 'description'],
};

const foodItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Name of the food item.' },
    quantity: { type: Type.NUMBER, description: 'The serving size or proportion of the item. Defaults to 1 for a single-item analysis.' },
    calories: { type: Type.NUMBER, description: 'Estimated calories.' },
    protein: { type: Type.NUMBER, description: 'Estimated protein in grams.' },
    carbs: { type: Type.NUMBER, description: 'Estimated carbohydrates in grams.' },
    fat: { type: Type.NUMBER, description: 'Estimated fat in grams.' },
    water: { type: Type.NUMBER, description: 'Estimated water content in milliliters.' },
    fiber: { type: Type.NUMBER, description: 'Estimated fiber in grams.' },
    sugar: { type: Type.NUMBER, description: 'Estimated sugar in grams.' },
    sodium: { type: Type.NUMBER, description: 'Estimated sodium in milligrams.' },
    potassium: { type: Type.NUMBER, description: 'Estimated potassium in milligrams.' },
    cholesterol: { type: Type.NUMBER, description: 'Estimated cholesterol in milligrams.' },
    saturatedFat: { type: Type.NUMBER, description: 'Estimated saturated fat in grams.' },
    transFat: { type: Type.NUMBER, description: 'Estimated trans fat in grams.' },
    calcium: { type: Type.NUMBER, description: 'Estimated calcium in milligrams.' },
    iron: { type: Type.NUMBER, description: 'Estimated iron in milligrams.' },
    zinc: { type: Type.NUMBER, description: 'Estimated zinc in milligrams.' },
    magnesium: { type: Type.NUMBER, description: 'Estimated magnesium in milligrams.' },
    phosphorus: { type: Type.NUMBER, description: 'Estimated phosphorus in milligrams.' },
    manganese: { type: Type.NUMBER, description: 'Estimated manganese in milligrams.' },
    copper: { type: Type.NUMBER, description: 'Estimated copper in milligrams.' },
    selenium: { type: Type.NUMBER, description: 'Estimated selenium in micrograms.' },
    iodine: { type: Type.NUMBER, description: 'Estimated iodine in micrograms.' },
    vitaminA: { type: Type.NUMBER, description: 'Estimated Vitamin A in micrograms (mcg).' },
    vitaminC: { type: Type.NUMBER, description: 'Estimated Vitamin C in milligrams.' },
    vitaminD: { type: Type.NUMBER, description: 'Estimated Vitamin D in micrograms (mcg).' },
    vitaminE: { type: Type.NUMBER, description: 'Estimated Vitamin E in milligrams.' },
    vitaminK: { type: Type.NUMBER, description: 'Estimated Vitamin K in micrograms.' },
    vitaminB1: { type: Type.NUMBER, description: 'Estimated Thiamin (B1) in milligrams.' },
    vitaminB2: { type: Type.NUMBER, description: 'Estimated Riboflavin (B2) in milligrams.' },
    vitaminB3: { type: Type.NUMBER, description: 'Estimated Niacin (B3) in milligrams.' },
    vitaminB5: { type: Type.NUMBER, description: 'Estimated Pantothenic Acid (B5) in milligrams.' },
    vitaminB6: { type: Type.NUMBER, description: 'Estimated Pyridoxine (B6) in milligrams.' },
    vitaminB7: { type: Type.NUMBER, description: 'Estimated Biotin (B7) in micrograms.' },
    vitaminB9: { type: Type.NUMBER, description: 'Estimated Folate (B9) in micrograms.' },
    vitaminB12: { type: Type.NUMBER, description: 'Estimated Cobalamin (B12) in micrograms.' },
    antiNutrients: { 
      type: Type.ARRAY, 
      items: antiNutrientSchema, 
      description: 'A list of any significant anti-nutrients found in the food item and their effects.' 
    },
  },
  required: ['name', 'quantity', 'calories', 'protein', 'carbs', 'fat'],
};


export const analyzeFoodImage = async (base64Image: string): Promise<AnalyzedFoodItem[]> => {
  try {
    // Upgraded to gemini-3-pro-preview for superior visual understanding
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: 'Analyze the food items in this image. For each distinct item, provide its name and detailed estimated nutrition (calories, protein, carbs, fat, water, fiber, sugar, sodium, all relevant vitamins and minerals). Set the `quantity` field to 1 for each item. Crucially, differentiate between raw ingredients and the final cooked dish. For prepared meals like a burger, your analysis must account for cooking methods (e.g., frying), added fats, sauces, and other components that significantly alter the nutritional profile from just its raw ingredients. Also, identify any common anti-nutrients (like oxalates, phytates, lectins) and briefly describe their effects.',
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema,
        },
      },
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as AnalyzedFoodItem[];

  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze image. The AI may not have recognized any food or an error occurred.");
  }
};

export const analyzeFoodFromText = async (text: string): Promise<AnalyzedFoodItem[]> => {
  if (!text.trim()) {
    return [];
  }
  try {
    // Upgraded to gemini-3-pro-preview for deeper reasoning on complex meal descriptions
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            text: `Analyze the food items in this description: "${text}". For each distinct item, provide its name and detailed estimated nutrition (calories, protein, carbs, fat, water, fiber, sugar, all relevant vitamins and minerals). Set the 'quantity' field to 1 for each item. Crucially, differentiate between raw ingredients and the final cooked dish. For prepared meals like a burger, your analysis must account for cooking methods (e.g., frying), added fats, sauces, and other components that significantly alter the nutritional profile from just its raw ingredients. Also, identify any common anti-nutrients (like oxalates, phytates, lectins) and briefly describe their effects.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema,
        },
      },
    });
    
    const jsonStr = response.text.trim();
    if (!jsonStr) return []; // Handle empty responses gracefully
    const result = JSON.parse(jsonStr);
    return result as AnalyzedFoodItem[];

  } catch (error) {
    console.error("Error analyzing food text:", error);
    throw new Error("Failed to analyze description. The AI may not have recognized any food or an error occurred.");
  }
};

export const analyzeMealConsumption = async (base64ImageBefore: string, base64ImageAfter: string): Promise<AnalyzedFoodItem[]> => {
  try {
    // Upgraded to gemini-3-pro-preview for better comparison capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64ImageBefore } },
          { text: 'This is the image of the meal BEFORE eating.' },
          { inlineData: { mimeType: 'image/jpeg', data: base64ImageAfter } },
          { text: `This is the image of the same meal AFTER eating (leftovers).

          Your task is to:
          1.  Analyze the "BEFORE" image to identify all food items and their detailed nutritional information for the full portion shown.
          2.  Compare the "BEFORE" and "AFTER" images to estimate the proportion of each food item that was consumed. This should be a number between 0 (not eaten) and 1 (fully eaten).
          3.  Return a JSON array of ALL food items identified in the "BEFORE" image. Each item in the array must contain the nutritional information for the FULL portion shown in the "BEFORE" image.
          4.  Crucially, for each item, you MUST include a 'quantity' field set to the consumed proportion you estimated (e.g., 0.75 for 75% eaten). If an item was not eaten at all, set its quantity to 0.
          5.  Also, identify any common anti-nutrients (like oxalates, phytates, lectins) and include them if present.
          6.  The response must be only the JSON array, with no other text or markdown. If no food is identifiable, return an empty array.` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: foodItemSchema,
        },
      },
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as AnalyzedFoodItem[];

  } catch (error) {
    console.error("Error analyzing meal consumption:", error);
    throw new Error("Failed to analyze the meal leftovers. The AI may not have recognized the food or an error occurred.");
  }
};


export const getChat = (
    history: { role: string; parts: { text: string }[] }[], 
    systemInstruction: string,
    tools?: any[]
) => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: {
            systemInstruction,
            tools: tools,
        }
    });
}

export const speakText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this in a helpful and clear tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    } else {
      throw new Error("No audio data received from API.");
    }
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate audio for the response.");
  }
};

// --- Food Checker Service ---

const nutrientDetailSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Name of the nutrient (e.g., "Sodium", "Sugar").' },
    value: { type: Type.NUMBER, description: 'Amount of the nutrient.' },
    unit: { type: Type.STRING, description: 'Unit for the amount (e.g., "g", "mg").' },
    percentOfDailyGoal: { type: Type.NUMBER, description: "The percentage of the user's daily goal this nutrient represents. If a goal for a nutrient isn't provided, estimate based on general recommendations." },
    isHigh: { type: Type.BOOLEAN, description: 'True if this nutrient level is considered high or excessive for a single serving (e.g., >20% of daily value for sodium or sugar).' },
  },
  required: ['name', 'value', 'unit', 'percentOfDailyGoal', 'isHigh'],
};

const genderWarningSchema = {
    type: Type.OBJECT,
    properties: {
        gender: { type: Type.STRING, description: 'The gender this warning applies to: "male" or "female".' },
        warning: { type: Type.STRING, description: 'A concise warning about potential negative effects for that gender.' },
    },
    required: ['gender', 'warning'],
};

const analyzedProductSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The commercial name of the food product.' },
    score: { type: Type.NUMBER, description: 'A holistic health score from 0 (very unhealthy) to 100 (very healthy), considering all nutrients and the user profile.' },
    verdict: { type: Type.STRING, description: 'A brief, personalized verdict (2-3 sentences) explaining the score and its potential effects on the user. Be encouraging and informative.' },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Up to 3 key highlights in plain language (e.g., "High in sodium", "Good source of fiber", "Contains artificial sweeteners").' },
    nutrients: { type: Type.ARRAY, items: nutrientDetailSchema, description: 'A detailed breakdown of key nutrients per serving. Always include Calories, Protein, Carbs, Fat, Sodium, and Sugar.' },
    antiNutrients: { 
      type: Type.ARRAY, 
      items: antiNutrientSchema, 
      description: 'A list of any significant anti-nutrients found in the product and their effects.' 
    },
    genderWarnings: {
      type: Type.ARRAY,
      items: genderWarningSchema,
      description: 'A list of any gender-specific warnings related to the product (e.g., high phytoestrogens for males).',
    }
  },
  required: ['name', 'score', 'verdict', 'highlights', 'nutrients'],
};

export const analyzeProductImage = async (
  base64Image: string, 
  userProfile: UserProfile, 
  dailyGoal: NutritionInfo
): Promise<AnalyzedProduct> => {
  const { age, weight, height, gender } = userProfile;
  
  const goalSummary = Object.entries(dailyGoal)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const prompt = `Analyze the food product in the image for a user who wants to know if they should eat it. When analyzing, consider not just the raw ingredients but also the overall composition and typical preparation method. For example, a raw potato is healthy, but deep-fried french fries are not. Your verdict should reflect the product as it's typically consumed.

User Profile:
- Age: ${age}
- Weight: ${weight} kg
- Height: ${height} cm
- Gender: ${gender}

User's Daily Nutrition Goals:
${goalSummary}
- General recommendation for Sodium: ~2300 mg
- General recommendation for Sugar: ~30 g

Based on the product label or your knowledge of the item, provide a detailed analysis. Assume a standard single serving size. Structure your response according to the provided JSON schema. The "verdict" must be personalized and easy to understand. The "score" should reflect overall healthiness for this specific user. The "nutrients" list must include at least Calories, Protein, Carbs, Fat, Sodium, and Sugar. In addition, identify any significant anti-nutrients present in the product (e.g., oxalates in spinach, phytates in whole grains) and include them in the 'antiNutrients' array.

Finally, consider the user's gender. If the product contains ingredients known to have specific negative effects for the user's gender (e.g., high phytoestrogens like soy for males concerned about testosterone, or items not recommended for females), add a concise, non-alarmist warning to the 'genderWarnings' array. Frame these as potential considerations, not absolute medical advice.`;

  try {
    // Upgraded to gemini-3-pro-preview for deeper label analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analyzedProductSchema,
        // Enable thinking for complex health score analysis
        thinkingConfig: { thinkingBudget: 4096 }, 
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as AnalyzedProduct;

  } catch (error) {
    console.error("Error analyzing product image:", error);
    throw new Error("Failed to analyze product. The AI may not have recognized it or an error occurred.");
  }
};

// --- Goal Calculation Service ---
const nutritionInfoSchemaProperties = {
    calories: { type: Type.NUMBER, description: 'Target daily calories in kcal.' },
    protein: { type: Type.NUMBER, description: 'Target daily protein in grams.' },
    carbs: { type: Type.NUMBER, description: 'Target daily carbohydrates in grams.' },
    fat: { type: Type.NUMBER, description: 'Target daily fat in grams.' },
    waterGoal: { type: Type.NUMBER, description: 'Target daily water intake in milliliters (ml).' },
    fiber: { type: Type.NUMBER, description: 'Target daily fiber in grams.' },
    sugar: { type: Type.NUMBER, description: 'Target daily sugar in grams.' },
    sodium: { type: Type.NUMBER, description: 'Target daily sodium in milligrams.' },
    potassium: { type: Type.NUMBER, description: 'Target daily potassium in milligrams.' },
    cholesterol: { type: Type.NUMBER, description: 'Target daily cholesterol in milligrams.' },
    saturatedFat: { type: Type.NUMBER, description: 'Target daily saturated fat in grams.' },
    transFat: { type: Type.NUMBER, description: 'Target daily trans fat in grams, should ideally be 0.' },
    calcium: { type: Type.NUMBER, description: 'Target daily calcium in milligrams.' },
    iron: { type: Type.NUMBER, description: 'Target daily iron in milligrams.' },
    zinc: { type: Type.NUMBER, description: 'Target daily zinc in milligrams.' },
    magnesium: { type: Type.NUMBER, description: 'Target daily magnesium in milligrams.' },
    phosphorus: { type: Type.NUMBER, description: 'Target daily phosphorus in milligrams.' },
    manganese: { type: Type.NUMBER, description: 'Target daily manganese in milligrams.' },
    copper: { type: Type.NUMBER, description: 'Target daily copper in milligrams.' },
    selenium: { type: Type.NUMBER, description: 'Target daily selenium in micrograms.' },
    iodine: { type: Type.NUMBER, description: 'Target daily iodine in micrograms.' },
    vitaminA: { type: Type.NUMBER, description: 'Target daily Vitamin A in micrograms (mcg).' },
    vitaminC: { type: Type.NUMBER, description: 'Target daily Vitamin C in milligrams.' },
    vitaminD: { type: Type.NUMBER, description: 'Target daily Vitamin D in micrograms (mcg).' },
    vitaminE: { type: Type.NUMBER, description: 'Target daily Vitamin E in milligrams.' },
    vitaminK: { type: Type.NUMBER, description: 'Target daily Vitamin K in micrograms.' },
    vitaminB1: { type: Type.NUMBER, description: 'Target daily Thiamin (B1) in milligrams.' },
    vitaminB2: { type: Type.NUMBER, description: 'Target daily Riboflavin (B2) in milligrams.' },
    vitaminB3: { type: Type.NUMBER, description: 'Target daily Niacin (B3) in milligrams.' },
    vitaminB5: { type: Type.NUMBER, description: 'Target daily Pantothenic Acid (B5) in milligrams.' },
    vitaminB6: { type: Type.NUMBER, description: 'Target daily Pyridoxine (B6) in milligrams.' },
    vitaminB7: { type: Type.NUMBER, description: 'Target daily Biotin (B7) in micrograms.' },
    vitaminB9: { type: Type.NUMBER, description: 'Target daily Folate (B9) in micrograms.' },
    vitaminB12: { type: Type.NUMBER, description: 'Target daily Cobalamin (B12) in micrograms.' },
};
const nutritionInfoSchema = {
    type: Type.OBJECT,
    properties: nutritionInfoSchemaProperties,
    required: Object.keys(nutritionInfoSchemaProperties),
};

export const calculatePersonalizedGoals = async (userProfile: UserProfile): Promise<NutritionInfo> => {
  const { age, weight, height, gender, aspirations, activityLevel, dietaryPreference, targetWeight } = userProfile;
  const prompt = `Act as an expert nutritionist. Based on the following user profile, calculate a comprehensive and personalized set of daily nutritional goals. Provide values for all nutrients in the specified schema. The 'waterGoal' should be based on factors like weight and activity level. The goals should be appropriate for the user's dietary preference.

User Profile:
- Age: ${age} years
- Current Weight: ${weight} kg
- Height: ${height} cm
- Gender: ${gender}
- Activity Level: ${activityLevel}
- Primary Goal/Aspiration: ${aspirations}
${targetWeight ? `- Target Weight: ${targetWeight} kg` : ''}
- Dietary Preference: ${dietaryPreference}

If a target weight is provided, tailor the calorie and macronutrient goals to help the user move from their current weight to their target weight at a healthy pace (e.g., ~0.5kg/week loss or gain).

Generate a complete JSON object with appropriate daily targets for all macros, vitamins, and minerals according to the provided schema.`;

  try {
    // Upgraded to gemini-3-pro-preview for expert-level planning
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutritionInfoSchema,
        thinkingConfig: { thinkingBudget: 8192 },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as NutritionInfo;

  } catch (error) {
    console.error("Error calculating personalized goals:", error);
    throw new Error("Failed to calculate goals with AI. Please try again.");
  }
};


const goalSuggestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      nutrient: {
        type: Type.STRING,
        description: 'The name of the macronutrient: "protein", "carbs", or "fat".',
      },
      value: {
        type: Type.NUMBER,
        description: 'The suggested daily intake in grams.',
      },
      reason: {
        type: Type.STRING,
        description: 'A brief, user-friendly explanation (max 1-2 sentences) for why this value is suggested, tailored to the user\'s aspiration.',
      },
    },
    required: ['nutrient', 'value', 'reason'],
  },
};

export const getGoalSuggestions = async (userProfile: UserProfile): Promise<GoalSuggestion[]> => {
  const { age, weight, height, gender, aspirations, activityLevel } = userProfile;
  const prompt = `Act as an expert nutritionist. Based on the user profile below, provide personalized daily goal suggestions ONLY for protein, carbs, and fat.

User Profile:
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- Gender: ${gender}
- Activity Level: ${activityLevel}
- Primary Goal/Aspiration: ${aspirations}

For each macronutrient (protein, carbs, fat), provide the suggested daily intake in grams and a concise, encouraging reason for that suggestion, directly related to their goal. For example, if their goal is 'Muscle Gain', the protein reason should mention muscle repair. The response must be an array of exactly 3 objects, one for each macronutrient.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: goalSuggestionSchema,
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as GoalSuggestion[];

  } catch (error) {
    console.error("Error getting goal suggestions:", error);
    throw new Error("Failed to get AI suggestions. Please try again.");
  }
};

// --- Meal Suggestion Service ---
const mealSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'A specific, appetizing name for the meal (e.g., "Grilled Salmon with Quinoa and Asparagus").' },
    mealType: { type: Type.STRING, description: 'The type of meal, must be one of: Breakfast, Lunch, Dinner, or Snack.' },
    description: { type: Type.STRING, description: 'A brief, encouraging sentence explaining why this meal is a good choice for the user based on their remaining nutritional needs.' },
    nutritionSummary: { type: Type.STRING, description: 'A short summary of the meal\'s key nutritional benefits (e.g., "High in Protein & Omega-3s", "Rich in Fiber").' },
  },
  required: ['name', 'mealType', 'description', 'nutritionSummary'],
};

export const getMealSuggestions = async (
  remainingNutrients: Partial<NutritionInfo>,
  pastMealNames: string[],
  userProfile: UserProfile,
): Promise<MealSuggestion[]> => {

  const remainingSummary = Object.entries(remainingNutrients)
    .filter(([key, value]) => ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar'].includes(key) && value! > 0)
    .map(([key, value]) => `- ${key}: ~${Math.round(value!)}`)
    .join('\n');

  if (!remainingSummary) {
    return [];
  }
    
  const pastMealsSummary = pastMealNames.length > 0 ? `The user has recently eaten: ${pastMealNames.slice(0, 10).join(', ')}.` : '';

  const prompt = `You are an expert nutritionist providing meal suggestions for a user of a health tracking app.

The user's dietary preference is ${userProfile.dietaryPreference}. All meal suggestions MUST strictly adhere to this preference.

The user's remaining nutritional needs for the day are approximately:
${remainingSummary}

${pastMealsSummary}

Your task is to suggest 4 specific, healthy, and appealing meal ideas to help the user meet their remaining goals. Prioritize meals that fill the biggest nutritional gaps. For example, if protein is low, suggest protein-rich meals. Offer variety and try not to repeat meals the user has recently eaten. When suggesting meals, emphasize healthy preparation methods (e.g., "grilled" or "steamed" instead of "fried").

For each meal, provide a name, the type of meal (Breakfast, Lunch, Dinner, or Snack), a short description of why it's a good choice, and a brief nutrition summary. Structure your response according to the provided JSON schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: mealSuggestionSchema
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as MealSuggestion[];

  } catch (error) {
    console.error("Error getting meal suggestions:", error);
    throw new Error("Failed to get AI suggestions. Please try again later.");
  }
};


// --- Weekly Insights Service ---
const weeklyInsightSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A short, engaging title for the weekly report (e.g., "Your Week in Review!").' },
    summary: { type: Type.STRING, description: 'A 2-3 sentence motivational summary of the user\'s week, focusing on overall progress and consistency.' },
    wins: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: 'A specific, positive achievement from the week (e.g., "You consistently met your protein goal.").' },
          icon: { type: Type.STRING, description: 'An icon name for this win. Choose from: "trophy", "star", "heart".' },
        },
        required: ['text', 'icon'],
      },
      description: 'An array of 2-3 key successes.',
    },
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: 'A gentle, constructive suggestion for improvement (e.g., "Sodium was a bit high on weekends.").' },
          icon: { type: Type.STRING, description: 'An icon name for this opportunity. Choose from: "seedling", "chart", "target".' },
        },
        required: ['text', 'icon'],
      },
      description: 'An array of 2-3 areas for growth.',
    },
    tipForNextWeek: { type: Type.STRING, description: 'A single, clear, and actionable piece of advice for the user to focus on next week.' },
  },
  required: ['title', 'summary', 'wins', 'opportunities', 'tipForNextWeek'],
};

export const getWeeklyInsight = async (
    meals: Meal[],
    userProfile: UserProfile,
    dailyGoal: NutritionInfo,
): Promise<WeeklyInsight> => {

    // Helper to format data for the prompt
    const weeklyDataSummary = meals.map(meal => {
        const day = new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short' });
        const { calories, protein, carbs, fat } = meal.nutrition;
        return `${day}: ${meal.name} (C:${Math.round(calories)}, P:${Math.round(protein)}, C:${Math.round(carbs)}, F:${Math.round(fat)})`;
    }).join('\n');

    const profileSummary = `Aspiration: ${userProfile.aspirations}, Activity: ${userProfile.activityLevel}, Dietary Pref: ${userProfile.dietaryPreference}.`;
    const goalSummary = `Goals: ~${Math.round(dailyGoal.calories)} kcal, ${Math.round(dailyGoal.protein)}g protein, ${Math.round(dailyGoal.carbs)}g carbs, ${Math.round(dailyGoal.fat)}g fat.`;

    const prompt = `You are an expert nutritionist and motivational coach analyzing a user's weekly meal data. Be positive, insightful, and encouraging.

User Profile: ${profileSummary}
User Goals: ${goalSummary}

Here is the user's meal log for the past week:
${weeklyDataSummary}

Analyze this data to create a personalized weekly report. Identify trends, successes, and areas for improvement. Your tone should be supportive, not critical. Provide specific, data-driven insights. Structure your response according to the provided JSON schema. Ensure the "wins" and "opportunities" are distinct and helpful, and the "tip for next week" is simple and actionable.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: weeklyInsightSchema,
                thinkingConfig: { thinkingBudget: 4096 },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result as WeeklyInsight;

    } catch (error) {
        console.error("Error generating weekly insight:", error);
        throw new Error("Failed to generate your weekly report with AI. Please try again.");
    }
};


// --- Recipe Generation Service ---
const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the recipe.' },
    description: { type: Type.STRING, description: 'A short, enticing description of the dish.' },
    calories: { type: Type.NUMBER, description: 'Estimated calories per serving.' },
    protein: { type: Type.NUMBER, description: 'Estimated protein in grams per serving.' },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the ingredient.' },
          amount: { type: Type.STRING, description: 'Amount and unit (e.g., "1 cup", "100g").' },
        },
        required: ['name', 'amount'],
      },
      description: 'List of ingredients for the recipe.',
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Step-by-step cooking instructions.',
    },
  },
  required: ['name', 'description', 'calories', 'protein', 'ingredients', 'instructions'],
};


export const generateRecipe = async (
  mealName: string,
  remainingCalories: number,
  dietaryPreference: UserProfile['dietaryPreference']
): Promise<Recipe> => {
  const prompt = `Generate a simple, healthy, single-serving recipe for "${mealName}".

The user's dietary preference is: ${dietaryPreference}. The recipe MUST strictly adhere to this.
The user has approximately ${Math.round(remainingCalories)} calories remaining for the day. The recipe should be close to this value, but prioritize being a balanced, healthy meal.

Provide a complete recipe with a name, description, estimated calories and protein, a list of ingredients with amounts, and clear, step-by-step instructions. The response must follow the provided JSON schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as Recipe;

  } catch (error) {
    console.error("Error generating recipe:", error);
    throw new Error("Failed to generate a recipe with AI. Please try again.");
  }
};


// --- Exercise Analysis Service ---
const activityAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'A concise name for the physical activity (e.g., "Running", "Yoga", "Weightlifting").' },
    durationMinutes: { type: Type.NUMBER, description: 'The duration of the activity in minutes.' },
    caloriesBurned: { type: Type.NUMBER, description: 'An estimated number of calories burned during the activity.' },
  },
  required: ['name', 'durationMinutes', 'caloriesBurned'],
};

export const analyzeActivityFromText = async (
  text: string,
  userProfile: UserProfile
): Promise<Omit<Exercise, 'id' | 'date'>> => {
  if (!text.trim()) {
    throw new Error("Activity description cannot be empty.");
  }

  const prompt = `Analyze the user's description of a physical activity and estimate the calories burned.

User's description: "${text}"

User's profile for context:
- Weight: ${userProfile.weight} kg
- Age: ${userProfile.age}
- Activity Level: ${userProfile.activityLevel}

Based on this information, extract the activity's name, its duration in minutes, and provide a reasonable estimate for the calories burned. Structure your response according to the provided JSON schema. Be accurate and realistic with your estimations.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: activityAnalysisSchema,
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result as Omit<Exercise, 'id' | 'date'>;

  } catch (error) {
    console.error("Error analyzing activity text:", error);
    throw new Error("Failed to analyze activity. The AI may not have recognized it or an error occurred.");
  }
};


// --- Daily Insight Service ---
const dailyInsightSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A short, engaging title for the insight (e.g., "Protein Win!", "Mindful Munching").' },
        summary: { type: Type.STRING, description: 'A 1-2 sentence motivational summary of a key observation from the user\'s recent data. Be positive and encouraging.' },
        icon: { type: Type.STRING, description: 'An icon name for this insight. Choose from: "trophy", "star", "heart", "seedling", "chart", "target", "lightbulb".' },
    },
    required: ['title', 'summary', 'icon'],
};

export const getDailyInsight = async (
    recentMeals: Meal[],
    userProfile: UserProfile,
    dailyGoal: NutritionInfo
): Promise<DailyInsight> => {
    const dataSummary = recentMeals.map(meal => {
        const day = new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short' });
        const { calories, protein, carbs, fat, water } = meal.nutrition;
        return `${day}: ${meal.name} (C:${Math.round(calories)}, P:${Math.round(protein)}, W:${Math.round(water ?? 0)})`;
    }).join('\n');

    const profileSummary = `Aspiration: ${userProfile.aspirations}.`;
    const goalSummary = `Goals: ~${Math.round(dailyGoal.calories)} kcal, ${Math.round(dailyGoal.protein)}g protein, ${Math.round(dailyGoal.waterGoal ?? 3000)}ml water.`;

    const prompt = `You are a supportive and insightful nutrition coach. Analyze the user's most recent meal data to find ONE positive achievement or a gentle, actionable tip.

User Profile: ${profileSummary}
User Goals: ${goalSummary}
Recent Meals:
${dataSummary}

Your task is to generate a single, concise insight. This could be praise for hitting a nutrient goal, a comment on a healthy meal choice, or a small tip for the day ahead. Your tone should be friendly and motivational. Do not be critical. Structure your response according to the provided JSON schema.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: dailyInsightSchema,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as DailyInsight;
    } catch (error) {
        console.error("Error generating daily insight:", error);
        throw new Error("Failed to generate a daily insight.");
    }
};

// --- Meal Suggestion Image Generation ---
export const generateImageForMeal = async (mealName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{
                    text: `A beautiful, artistic food illustration of "${mealName}". Stylized, modern, appetizing, not a photo. Aspect ratio 16:9.`
                }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("No image data received from API.");
    } catch (error) {
        console.error("Error generating image for meal suggestion:", error);
        throw new Error("Failed to generate image for the meal suggestion.");
    }
};