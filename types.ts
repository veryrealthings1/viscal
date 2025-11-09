export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Extended nutrients
  water?: number; // in ml
  waterGoal?: number; // in ml
  fiber?: number;
  sugar?: number;
  sodium?: number; // in mg
  potassium?: number; // in mg
  cholesterol?: number; // in mg
  saturatedFat?: number;
  transFat?: number;
  calcium?: number; // in mg
  iron?: number; // in mg
  zinc?: number; // in mg
  magnesium?: number; // in mg
  phosphorus?: number; // in mg
  manganese?: number; // in mg
  copper?: number; // in mg
  selenium?: number; // in mcg
  iodine?: number; // in mcg
  vitaminA?: number; // in mcg
  vitaminC?: number; // in mg
  vitaminD?: number; // in mcg
  vitaminE?: number; // in mg
  vitaminK?: number; // in mcg
  vitaminB1?: number; // Thiamin in mg
  vitaminB2?: number; // Riboflavin in mg
  vitaminB3?: number; // Niacin in mg
  vitaminB5?: number; // Pantothenic Acid in mg
  vitaminB6?: number; // Pyridoxine in mg
  vitaminB7?: number; // Biotin in mcg
  vitaminB9?: number; // Folate in mcg
  vitaminB12?: number; // Cobalamin in mcg
}


export interface AnalyzedFoodItem extends NutritionInfo {
  name: string;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface Meal {
  id: string;
  name: string;
  nutrition: NutritionInfo;
  imageUrl?: string;
  items: AnalyzedFoodItem[];
  date: string; // ISO string for date
  time: string; // HH:mm format for time
  source: 'photo' | 'manual' | 'barcode' | 'voice';
  mealType: MealType;
}

export interface WaterLog {
  id: string;
  amount: number; // in ml
  date: string; // ISO string
}

export interface Exercise {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  date: string; // ISO string
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  category: 'Milestone' | 'Consistency' | 'Nutrition' | 'Logging' | 'Hydration';
  rarity: 'Common' | 'Rare' | 'Epic';
}

export interface UserProfile {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female' | 'other';
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
  aspirations: 'Weight Loss' | 'Muscle Gain' | 'Maintain Health' | 'Increase Energy';
  dietaryPreference: 'non-vegetarian' | 'vegetarian' | 'vegan';
  weightHistory: { date: string; weight: number }[];
}

export interface NutrientDetail {
  name: string;
  value: number;
  unit: string;
  percentOfDailyGoal: number;
  isHigh: boolean;
}

export interface AnalyzedProduct {
  name: string;
  score: number; // 0-100
  verdict: string;
  highlights: string[];
  nutrients: NutrientDetail[];
}

export interface GoalSuggestion {
    nutrient: 'protein' | 'carbs' | 'fat';
    value: number;
    reason: string;
}

export interface MealSuggestion {
  name: string;
  mealType: MealType;
  description: string;
  nutritionSummary: string;
}

export interface WeeklyInsight {
  title: string;
  summary: string;
  wins: { text: string; icon: string; }[];
  opportunities: { text: string; icon: string; }[];
  tipForNextWeek: string;
}

export interface Recipe {
  name: string;
  description: string;
  calories: number;
  protein: number;
  ingredients: { name: string; amount: string; }[];
  instructions: string[];
}

export interface DailyInsight {
  title: string;
  summary: string;
  icon: string;
}