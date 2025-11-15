import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Meal, NutritionInfo, UserProfile, Exercise, WaterLog, Recipe, DailyInsight, ChatMessage } from '../types';
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

// --- Local Data Service ---
const LOCAL_STORAGE_KEY = 'visioncal-data';

const getUserId = (): string => {
    let userId = localStorage.getItem('visioncal-userId');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('visioncal-userId', userId);
    }
    return userId;
};

const getUserData = async (userId: string) => {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${userId}`);
    return data ? JSON.parse(data) : null;
};

const saveUserData = async (userId: string, data: any) => {
    const existingData = await getUserData(userId) || {};
    const newData = { ...existingData, ...data };
    localStorage.setItem(`${LOCAL_STORAGE_KEY}-${userId}`, JSON.stringify(newData));
};

const resetLocalData = () => {
    const userId = localStorage.getItem('visioncal-userId');
    localStorage.clear();
    if (userId) {
        localStorage.setItem('visioncal-userId', userId);
    }
    window.location.reload();
};

interface DataContextType {
  userId: string | null;
  meals: Meal[];
  exercises: Exercise[];
  waterLogs: WaterLog[];
  dailyGoal: NutritionInfo;
  userProfile: UserProfile;
  savedRecipes: Recipe[];
  chatHistory: ChatMessage[];
  dailyInsight: DailyInsight | null;
  unlockedAchievements: Set<string>;
  setUnlockedAchievements: React.Dispatch<React.SetStateAction<Set<string>>>;
  setChatHistory: (history: ChatMessage[]) => void;
  todaysNutrition: NutritionInfo;
  todaysWaterIntake: number;
  currentStreak: number;
  todaysCaloriesBurned: number;
  dataLoaded: boolean;
  profileComplete: boolean;
  tourComplete: boolean;
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
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  markProfileAsComplete: () => void;
  markTourAsComplete: () => void;
  resetData: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultProfile: UserProfile = { age: 30, weight: 70, height: 175, gender: 'other', activityLevel: 'Sedentary', aspirations: 'Maintain Health', targetWeight: undefined, dietaryPreference: 'non-vegetarian', weightHistory: [] };
const defaultGoal: NutritionInfo = { calories: 2000, protein: 150, carbs: 200, fat: 70, waterGoal: 3000, fiber: 30, sugar: 25, sodium: 2300, potassium: 3500, cholesterol: 300, saturatedFat: 20, transFat: 0, calcium: 1000, iron: 18, vitaminA: 900, vitaminC: 90, vitaminD: 20 };
const initialWelcomeMessage: ChatMessage = { role: 'model', text: "Hello! I'm your AI Nutritionist. How can I help you today? You can ask me things like:\n\n* 'What should I eat for dinner?'\n* 'Log a chicken salad for lunch.'\n* 'How did I do on my protein goal yesterday?'" };

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [dailyGoal, setDailyGoal] = useState<NutritionInfo>(defaultGoal);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [profileComplete, setProfileComplete] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);

  // --- User ID Setup ---
  useEffect(() => {
    const localUserId = getUserId();
    setUserId(localUserId);
  }, []);
  
  // --- Data Loading ---
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setDataLoaded(false);
      try {
        const data = await getUserData(userId);
        setMeals(data?.meals || []);
        setExercises(data?.exercises || []);
        setWaterLogs(data?.waterLogs || []);
        setUserProfile(data?.userProfile || defaultProfile);
        setDailyGoal(data?.dailyGoal || defaultGoal);
        setUnlockedAchievements(new Set(data?.unlockedAchievements || []));
        setSavedRecipes(data?.savedRecipes || []);
        setTheme(data?.theme || 'system');
        setChatHistory(data?.chatHistory && data.chatHistory.length > 0 ? data.chatHistory : [initialWelcomeMessage]);
        setProfileComplete(data?.profile_complete ?? false);
        setTourComplete(data?.onboarding_complete ?? false);
      } catch (error) {
        console.error("Failed to load user data from Local Storage", error);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, [userId]);

  // Fetch daily insight (cached in local storage)
  useEffect(() => {
    if (!dataLoaded || !userId) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const cachedItem = localStorage.getItem(`visioncal-dailyInsight-${userId}`);
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
                localStorage.setItem(`visioncal-dailyInsight-${userId}`, JSON.stringify({ date: todayStr, insight }));
            } catch (e) {
                console.error("Failed to fetch daily insight", e);
            }
        }
    };
    setTimeout(fetchInsight, 2000);
  }, [dataLoaded, meals, userProfile, dailyGoal, userId]);


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
    const uniqueDays: string[] = [...new Set(meals.map(m => getDayFromISO(m.date)))].sort((a, b) => b.localeCompare(a));
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
  const addMeal = useCallback((meal: Meal) => setMeals(prev => {
    const newMeals = [...prev, meal];
    if (userId) saveUserData(userId, { meals: newMeals });
    return newMeals;
  }), [userId]);

  const updateMeal = useCallback((mealId: string, updatedMeal: Meal) => {
    setMeals(prev => {
      const newMeals = prev.map(m => m.id === mealId ? updatedMeal : m);
      if (userId) saveUserData(userId, { meals: newMeals });
      return newMeals;
    });
  }, [userId]);

  const deleteMeal = useCallback((mealId: string) => {
    setMeals(prev => {
      const newMeals = prev.filter(m => m.id !== mealId);
      if (userId) saveUserData(userId, { meals: newMeals });
      return newMeals;
    });
  }, [userId]);

  const addExercise = useCallback((exercise: Omit<Exercise, 'id' | 'date'>) => {
    const newExercise: Exercise = { ...exercise, id: new Date().toISOString(), date: new Date().toISOString() };
    setExercises(prev => {
      const newExercises = [...prev, newExercise];
      if (userId) saveUserData(userId, { exercises: newExercises });
      return newExercises;
    });
  }, [userId]);

  const deleteExercise = useCallback((exerciseId: string) => {
    setExercises(prev => {
      const newExercises = prev.filter(e => e.id !== exerciseId);
      if (userId) saveUserData(userId, { exercises: newExercises });
      return newExercises;
    });
  }, [userId]);
  
  const addWeightEntry = useCallback((weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setUserProfile(prev => {
        const newHistory = prev.weightHistory ? [...prev.weightHistory] : [];
        const todayEntryIndex = newHistory.findIndex(e => e.date === today);
        if (todayEntryIndex > -1) newHistory[todayEntryIndex] = { date: today, weight };
        else newHistory.push({ date: today, weight });
        const newProfile = { ...prev, weight, weightHistory: newHistory };
        if (userId) saveUserData(userId, { userProfile: newProfile });
        return newProfile;
    });
  }, [userId]);

  const addWaterLog = useCallback((amount: number) => {
    const newLog: WaterLog = { id: new Date().toISOString(), amount, date: new Date().toISOString() };
    setWaterLogs(prev => {
      const newLogs = [...prev, newLog];
      if (userId) saveUserData(userId, { waterLogs: newLogs });
      return newLogs;
    });
  }, [userId]);

  const addRecipe = useCallback((recipe: Recipe) => {
    setSavedRecipes(prev => {
        if (prev.some(r => r.name === recipe.name)) return prev;
        const newRecipes = [...prev, recipe];
        if (userId) saveUserData(userId, { savedRecipes: newRecipes });
        return newRecipes;
    });
  }, [userId]);

  const deleteRecipe = useCallback((recipeName: string) => {
    setSavedRecipes(prev => {
      const newRecipes = prev.filter(r => r.name !== recipeName);
      if (userId) saveUserData(userId, { savedRecipes: newRecipes });
      return newRecipes;
    });
  }, [userId]);

  const handleSetDailyGoal = useCallback((goalOrUpdater: React.SetStateAction<NutritionInfo>) => {
    setDailyGoal(prev => {
        const newGoal = typeof goalOrUpdater === 'function' ? goalOrUpdater(prev) : goalOrUpdater;
        if (userId) saveUserData(userId, { dailyGoal: newGoal });
        return newGoal;
    });
  }, [userId]);
  
  const handleSetUserProfile = useCallback((profileOrUpdater: React.SetStateAction<UserProfile>) => {
    setUserProfile(prev => {
        const newProfile = typeof profileOrUpdater === 'function' ? profileOrUpdater(prev) : profileOrUpdater;
        if (userId) saveUserData(userId, { userProfile: newProfile });
        return newProfile;
    });
  }, [userId]);

  const handleSetUnlockedAchievements = useCallback((achievementsOrUpdater: React.SetStateAction<Set<string>>) => {
    setUnlockedAchievements(prev => {
        const newSet = typeof achievementsOrUpdater === 'function' ? achievementsOrUpdater(prev) : achievementsOrUpdater;
        if (userId) saveUserData(userId, { unlockedAchievements: Array.from(newSet) });
        return newSet;
    });
  }, [userId]);
  
  const handleSetTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (userId) saveUserData(userId, { theme: newTheme });
  }, [userId]);

  const handleSetChatHistory = useCallback((history: ChatMessage[]) => {
    setChatHistory(history);
    if (userId) saveUserData(userId, { chatHistory: history });
  }, [userId]);

  const markProfileAsComplete = useCallback(() => {
    if (userId) saveUserData(userId, { profile_complete: true });
    setProfileComplete(true);
  }, [userId]);

  const markTourAsComplete = useCallback(() => {
    if (userId) saveUserData(userId, { onboarding_complete: true });
    setTourComplete(true);
  }, [userId]);
  
  const resetData = useCallback(() => {
    resetLocalData();
  }, []);

  const value = {
    userId, meals, exercises, waterLogs, dailyGoal, userProfile, savedRecipes, dailyInsight,
    chatHistory, setChatHistory: handleSetChatHistory, unlockedAchievements, setUnlockedAchievements: handleSetUnlockedAchievements,
    todaysNutrition, todaysWaterIntake, currentStreak, todaysCaloriesBurned, dataLoaded, profileComplete, tourComplete,
    addMeal, updateMeal, deleteMeal, setDailyGoal: handleSetDailyGoal, setUserProfile: handleSetUserProfile,
    addWeightEntry, addExercise, deleteExercise, addWaterLog, addRecipe, deleteRecipe,
    theme, setTheme: handleSetTheme, markProfileAsComplete, markTourAsComplete, resetData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};