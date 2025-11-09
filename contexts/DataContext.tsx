import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Meal, NutritionInfo, UserProfile, Exercise, WaterLog, Recipe, DailyInsight } from '../types';
import { initialNutrition } from '../services/utils';
import { getDailyInsight } from '../services/geminiService';

const getDayFromISO = (iso: string) => iso.split('T')[0];
const getDaysApart = (day1: string, day2: string) => {
    const date1 = new Date(day1);
    const date2 = new Date(day2);
    date1.setUTCHours(0, 0, 0, 0);
    date2.setUTCHours(0, 0, 0, 0);
    return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

interface DataContextType {
  meals: Meal[];
  exercises: Exercise[];
  waterLogs: WaterLog[];
  dailyGoal: NutritionInfo;
  userProfile: UserProfile;
  savedRecipes: Recipe[];
  dailyInsight: DailyInsight | null;
  unlockedAchievements: Set<string>;
  setUnlockedAchievements: React.Dispatch<React.SetStateAction<Set<string>>>;
  todaysNutrition: NutritionInfo;
  todaysWaterIntake: number;
  currentStreak: number;
  todaysCaloriesBurned: number;
  dataLoaded: boolean;
  addMeal: (meal: Meal) => void;
  updateMeal: (mealId: string, updatedMeal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  setDailyGoal: React.Dispatch<React.SetStateAction<NutritionInfo>>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  addWeightEntry: (weight: number) => void;
  addExercise: (exercise: Omit<Exercise, 'id' | 'date'>) => void;
  deleteExercise: (exerciseId: string) => void;
  addWaterLog: (amount: number) => void;
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeName: string) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultProfile: UserProfile = { age: 30, weight: 70, height: 175, gender: 'other', activityLevel: 'Sedentary', aspirations: 'Maintain Health', dietaryPreference: 'non-vegetarian', weightHistory: [] };
const defaultGoal: NutritionInfo = { calories: 2000, protein: 150, carbs: 200, fat: 70, waterGoal: 3000, fiber: 30, sugar: 25, sodium: 2300, potassium: 3500, cholesterol: 300, saturatedFat: 20, transFat: 0, calcium: 1000, iron: 18, vitaminA: 900, vitaminC: 90, vitaminD: 20 };

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [dailyGoal, setDailyGoal] = useState<NutritionInfo>(defaultGoal);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedMeals = localStorage.getItem('visioncal-meals');
      if (storedMeals) setMeals(JSON.parse(storedMeals));

      const storedExercises = localStorage.getItem('visioncal-exercises');
      if (storedExercises) setExercises(JSON.parse(storedExercises));

      const storedWaterLogs = localStorage.getItem('visioncal-waterLogs');
      if (storedWaterLogs) setWaterLogs(JSON.parse(storedWaterLogs));
      
      const storedProfile = localStorage.getItem('visioncal-userProfile');
      if (storedProfile) setUserProfile(JSON.parse(storedProfile));
      else setUserProfile(defaultProfile);

      const storedGoal = localStorage.getItem('visioncal-dailyGoal');
      if (storedGoal) setDailyGoal(JSON.parse(storedGoal));
      else setDailyGoal(defaultGoal);
      
      const storedAchievements = localStorage.getItem('visioncal-unlockedAchievements');
      if (storedAchievements) setUnlockedAchievements(new Set(JSON.parse(storedAchievements)));

      const storedRecipes = localStorage.getItem('visioncal-savedRecipes');
      if (storedRecipes) setSavedRecipes(JSON.parse(storedRecipes));

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setMeals([]); setExercises([]); setWaterLogs([]); setUserProfile(defaultProfile);
        setDailyGoal(defaultGoal); setUnlockedAchievements(new Set()); setSavedRecipes([]);
    } finally {
        setDataLoaded(true);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-meals', JSON.stringify(meals)); }, [meals, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-exercises', JSON.stringify(exercises)); }, [exercises, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-waterLogs', JSON.stringify(waterLogs)); }, [waterLogs, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-userProfile', JSON.stringify(userProfile)); }, [userProfile, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-dailyGoal', JSON.stringify(dailyGoal)); }, [dailyGoal, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-unlockedAchievements', JSON.stringify(Array.from(unlockedAchievements))); }, [unlockedAchievements, dataLoaded]);
  useEffect(() => { if (dataLoaded) localStorage.setItem('visioncal-savedRecipes', JSON.stringify(savedRecipes)); }, [savedRecipes, dataLoaded]);

  // Fetch daily insight (cached)
  useEffect(() => {
    if (!dataLoaded) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const cachedItem = localStorage.getItem('visioncal-dailyInsight');
    if (cachedItem) {
        const { date, insight } = JSON.parse(cachedItem);
        if (date === todayStr) {
            setDailyInsight(insight);
            return;
        }
    }

    const fetchInsight = async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const recentMeals = meals.filter(m => new Date(m.date) >= twoDaysAgo);
        
        if (recentMeals.length > 0) {
            try {
                const insight = await getDailyInsight(recentMeals, userProfile, dailyGoal);
                setDailyInsight(insight);
                localStorage.setItem('visioncal-dailyInsight', JSON.stringify({ date: todayStr, insight }));
            } catch (e) {
                console.error("Failed to fetch daily insight", e);
            }
        }
    };
    // Fetch after a short delay to not block initial render
    setTimeout(fetchInsight, 2000);
  }, [dataLoaded, meals, userProfile, dailyGoal]);


  // Derived State
  const todaysNutrition = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    const todaysMeals = meals.filter(meal => meal.date.startsWith(todayISO));
    return todaysMeals.reduce((acc, meal) => {
        for (const key in meal.nutrition) {
            const nutrientKey = key as keyof NutritionInfo;
            if (typeof meal.nutrition[nutrientKey] === 'number') {
                acc[nutrientKey] = (acc[nutrientKey] ?? 0) + (meal.nutrition[nutrientKey] ?? 0);
            }
        }
        return acc;
    }, { ...initialNutrition });
  }, [meals]);
  
  const todaysWaterIntake = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return waterLogs
      .filter(log => log.date.startsWith(todayISO))
      .reduce((total, log) => total + log.amount, 0);
  }, [waterLogs]);

  const todaysCaloriesBurned = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return exercises
      .filter(exercise => exercise.date.startsWith(todayISO))
      .reduce((total, exercise) => total + exercise.caloriesBurned, 0);
  }, [exercises]);

  const currentStreak = useMemo(() => {
    if (meals.length === 0) return 0;
    const uniqueDays = Array.from(new Set(meals.map(m => getDayFromISO(m.date)))).sort((a, b) => b.localeCompare(a));
    const today = getDayFromISO(new Date().toISOString());
    const lastLogDay = uniqueDays[0];
    if (getDaysApart(lastLogDay, today) > 1) return 0;
    let streak = 0;
    if (uniqueDays.includes(today) || getDaysApart(lastLogDay, today) === 1) {
        streak = 1;
        for (let i = 0; i < uniqueDays.length - 1; i++) {
            if (getDaysApart(uniqueDays[i+1], uniqueDays[i]) === 1) {
                streak++;
            } else {
                break;
            }
        }
    }
    return streak;
  }, [meals]);

  // Data Manipulation Functions
  const addMeal = useCallback((meal: Meal) => setMeals(prev => [...prev, meal]), []);
  const updateMeal = useCallback((mealId: string, updatedMeal: Meal) => {
    setMeals(prev => prev.map(m => m.id === mealId ? updatedMeal : m));
  }, []);
  const deleteMeal = useCallback((mealId: string) => {
    setMeals(prev => prev.filter(m => m.id !== mealId));
  }, []);
  const addExercise = useCallback((exercise: Omit<Exercise, 'id' | 'date'>) => {
    const newExercise: Exercise = {
        ...exercise,
        id: new Date().toISOString(),
        date: new Date().toISOString(),
    };
    setExercises(prev => [...prev, newExercise]);
  }, []);
  const deleteExercise = useCallback((exerciseId: string) => {
    setExercises(prev => prev.filter(e => e.id !== exerciseId));
  }, []);
  const addWeightEntry = useCallback((weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setUserProfile(prev => {
        const newHistory = prev.weightHistory ? [...prev.weightHistory] : [];
        const todayEntryIndex = newHistory.findIndex(e => e.date === today);
        if (todayEntryIndex > -1) newHistory[todayEntryIndex] = { date: today, weight };
        else newHistory.push({ date: today, weight });
        return { ...prev, weight, weightHistory: newHistory };
    });
  }, []);
  const addWaterLog = useCallback((amount: number) => {
    const newLog: WaterLog = {
        id: new Date().toISOString(),
        amount,
        date: new Date().toISOString(),
    };
    setWaterLogs(prev => [...prev, newLog]);
  }, []);
  const addRecipe = useCallback((recipe: Recipe) => {
    setSavedRecipes(prev => {
        if (prev.some(r => r.name === recipe.name)) {
            return prev; // Avoid duplicates
        }
        return [...prev, recipe];
    });
  }, []);
  const deleteRecipe = useCallback((recipeName: string) => {
    setSavedRecipes(prev => prev.filter(r => r.name !== recipeName));
  }, []);

  const value = {
    meals, exercises, waterLogs, dailyGoal, userProfile, savedRecipes, dailyInsight,
    unlockedAchievements, setUnlockedAchievements, todaysNutrition,
    todaysWaterIntake, currentStreak, todaysCaloriesBurned, dataLoaded,
    addMeal, updateMeal, deleteMeal, setDailyGoal, setUserProfile,
    addWeightEntry, addExercise, deleteExercise, addWaterLog, addRecipe, deleteRecipe
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};