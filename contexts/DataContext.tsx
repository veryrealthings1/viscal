
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Meal, NutritionInfo, UserProfile, Exercise, WaterLog, Recipe, DailyInsight, ChatMessage } from '../types';
import { initialNutrition } from '../services/utils';
import { getDailyInsight } from '../services/geminiService';
import { getUserData, saveUserData, deleteUserData, onAuthStateChange, signOut as supabaseSignOut, getSession } from '../services/supabaseService';

const getDayFromISO = (iso: string) => iso.split('T')[0];
const getDaysApart = (day1: string, day2: string) => {
    const date1 = new Date(day1);
    const date2 = new Date(day2);
    date1.setUTCHours(0, 0, 0, 0);
    date2.setUTCHours(0, 0, 0, 0);
    return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

interface DataContextType {
  session: Session | null;
  user: User | null;
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
  signOut: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultProfile: UserProfile = { age: 30, weight: 70, height: 175, gender: 'other', activityLevel: 'Sedentary', aspirations: 'Maintain Health', targetWeight: undefined, dietaryPreference: 'non-vegetarian', weightHistory: [] };
const defaultGoal: NutritionInfo = { calories: 2000, protein: 150, carbs: 200, fat: 70, waterGoal: 3000, fiber: 30, sugar: 25, sodium: 2300, potassium: 3500, cholesterol: 300, saturatedFat: 20, transFat: 0, calcium: 1000, iron: 18, vitaminA: 900, vitaminC: 90, vitaminD: 20 };
const initialWelcomeMessage: ChatMessage = { role: 'model', text: "Hello! I'm your AI Nutritionist. How can I help you today? You can ask me things like:\n\n* 'What should I eat for dinner?'\n* 'Log a chicken salad for lunch.'\n* 'How did I do on my protein goal yesterday?'" };

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
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

  const clearState = useCallback(() => {
    setMeals([]);
    setExercises([]);
    setWaterLogs([]);
    setDailyGoal(defaultGoal);
    setUserProfile(defaultProfile);
    setUnlockedAchievements(new Set());
    setSavedRecipes([]);
    setChatHistory([initialWelcomeMessage]);
    setDailyInsight(null);
    setTheme('system');
    setProfileComplete(false);
    setTourComplete(false);
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const data = await getUserData(userId);
      if (data) {
        setMeals(data.meals || []);
        setExercises(data.exercises || []);
        setWaterLogs(data.waterLogs || []);
        
        // Robust merge for profile: ensure weightHistory is an array and existing fields are preserved.
        const storedProfile = data.userProfile || {};
        const mergedProfile: UserProfile = { 
            ...defaultProfile, 
            ...storedProfile, 
            // Explicitly ensure weightHistory is an array to prevent crashes
            weightHistory: (Array.isArray(storedProfile.weightHistory)) 
                ? storedProfile.weightHistory 
                : (defaultProfile.weightHistory || [])
        };
        setUserProfile(mergedProfile);

        const loadedGoal = (data.dailyGoal && Object.keys(data.dailyGoal).length > 0)
            ? { ...defaultGoal, ...data.dailyGoal }
            : defaultGoal;
        setDailyGoal(loadedGoal);

        setUnlockedAchievements(new Set(data.unlockedAchievements || []));
        setSavedRecipes(data.savedRecipes || []);
        setTheme(data.theme || 'system');
        setChatHistory(data.chatHistory && data.chatHistory.length > 0 ? data.chatHistory : [initialWelcomeMessage]);
        setProfileComplete(data.profileComplete ?? false);
        setTourComplete(data.tourComplete ?? false);
      }
    } catch (error) {
      console.error("Failed to load user data", error);
      clearState(); // Reset to default state on error
    }
  }, [clearState]);

  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setDataLoaded(false);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        await loadUserData(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        clearState();
      }
      setDataLoaded(true);
    });
    
    // Check initial session
    const checkInitialSession = async () => {
      const { data } = await getSession();
      setSession(data.session);
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser.id);
      }
      setDataLoaded(true);
    };

    checkInitialSession();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loadUserData, clearState]);

  // Fetch daily insight (cached in local storage)
  useEffect(() => {
    if (!dataLoaded || !user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const cachedItem = localStorage.getItem(`visioncal-dailyInsight-${user.id}`);
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
                localStorage.setItem(`visioncal-dailyInsight-${user.id}`, JSON.stringify({ date: todayStr, insight }));
            } catch (e) {
                console.error("Failed to fetch daily insight", e);
            }
        }
    };
    setTimeout(fetchInsight, 2000);
  }, [dataLoaded, meals, userProfile, dailyGoal, user]);


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
    const uniqueDays: string[] = Array.from<string>(new Set(meals.map(m => getDayFromISO(m.date)))).sort((a, b) => b.localeCompare(a));
    const today = getDayFromISO(new Date().toISOString());
    const lastLogDay = uniqueDays[0];
    
    // If last log was yesterday or today, streak is active
    const gap = getDaysApart(lastLogDay, today);
    if (gap > 1) return 0;

    // Robust streak calculation: consecutive days in uniqueDays
    let currentCount = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        if (getDaysApart(uniqueDays[i+1], uniqueDays[i]) === 1) {
            currentCount++;
        } else {
            break;
        }
    }
    return currentCount;
  }, [meals]);

  // Data Manipulation Functions
  const addMeal = useCallback((meal: Meal) => setMeals(prev => {
    const newMeals = [...prev, meal];
    if (user) saveUserData(user.id, { meals: newMeals });
    return newMeals;
  }), [user]);

  const updateMeal = useCallback((mealId: string, updatedMeal: Meal) => {
    setMeals(prev => {
      const newMeals = prev.map(m => m.id === mealId ? updatedMeal : m);
      if (user) saveUserData(user.id, { meals: newMeals });
      return newMeals;
    });
  }, [user]);

  const deleteMeal = useCallback((mealId: string) => {
    setMeals(prev => {
      const newMeals = prev.filter(m => m.id !== mealId);
      if (user) saveUserData(user.id, { meals: newMeals });
      return newMeals;
    });
  }, [user]);

  const addExercise = useCallback((exercise: Omit<Exercise, 'id' | 'date'>) => {
    const newExercise: Exercise = { ...exercise, id: new Date().toISOString(), date: new Date().toISOString() };
    setExercises(prev => {
      const newExercises = [...prev, newExercise];
      if (user) saveUserData(user.id, { exercises: newExercises });
      return newExercises;
    });
  }, [user]);

  const deleteExercise = useCallback((exerciseId: string) => {
    setExercises(prev => {
      const newExercises = prev.filter(e => e.id !== exerciseId);
      if (user) saveUserData(user.id, { exercises: newExercises });
      return newExercises;
    });
  }, [user]);
  
  const addWeightEntry = useCallback((weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    setUserProfile(prev => {
        const newHistory = prev.weightHistory ? [...prev.weightHistory] : [];
        const todayEntryIndex = newHistory.findIndex(e => e.date === today);
        if (todayEntryIndex > -1) newHistory[todayEntryIndex] = { date: today, weight };
        else newHistory.push({ date: today, weight });
        const newProfile = { ...prev, weight, weightHistory: newHistory };
        if (user) saveUserData(user.id, { user_profile: newProfile });
        return newProfile;
    });
  }, [user]);

  const addWaterLog = useCallback((amount: number) => {
    const newLog: WaterLog = { id: new Date().toISOString(), amount, date: new Date().toISOString() };
    setWaterLogs(prev => {
      const newLogs = [...prev, newLog];
      if (user) saveUserData(user.id, { water_logs: newLogs });
      return newLogs;
    });
  }, [user]);

  const addRecipe = useCallback((recipe: Recipe) => {
    setSavedRecipes(prev => {
        if (prev.some(r => r.name === recipe.name)) return prev;
        const newRecipes = [...prev, recipe];
        if (user) saveUserData(user.id, { saved_recipes: newRecipes });
        return newRecipes;
    });
  }, [user]);

  const deleteRecipe = useCallback((recipeName: string) => {
    setSavedRecipes(prev => {
      const newRecipes = prev.filter(r => r.name !== recipeName);
      if (user) saveUserData(user.id, { saved_recipes: newRecipes });
      return newRecipes;
    });
  }, [user]);

  const handleSetDailyGoal = useCallback((goalOrUpdater: React.SetStateAction<NutritionInfo>) => {
    setDailyGoal(prev => {
        const newGoal = typeof goalOrUpdater === 'function' ? goalOrUpdater(prev) : goalOrUpdater;
        if (user) saveUserData(user.id, { daily_goal: newGoal });
        return newGoal;
    });
  }, [user]);
  
  const handleSetUserProfile = useCallback((profileOrUpdater: React.SetStateAction<UserProfile>) => {
    setUserProfile(prev => {
        const newProfile = typeof profileOrUpdater === 'function' ? profileOrUpdater(prev) : profileOrUpdater;
        if (user) saveUserData(user.id, { user_profile: newProfile });
        return newProfile;
    });
  }, [user]);

  const handleSetUnlockedAchievements = useCallback((achievementsOrUpdater: React.SetStateAction<Set<string>>) => {
    setUnlockedAchievements(prev => {
        const newSet = typeof achievementsOrUpdater === 'function' ? achievementsOrUpdater(prev) : achievementsOrUpdater;
        // Convert Set to Array for storage. Array.from creates a new array instance.
        if (user) saveUserData(user.id, { unlocked_achievements: Array.from(newSet) });
        return newSet;
    });
  }, [user]);
  
  const handleSetTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (user) saveUserData(user.id, { theme: newTheme });
  }, [user]);

  const handleSetChatHistory = useCallback((history: ChatMessage[]) => {
    setChatHistory(history);
    if (user) saveUserData(user.id, { chat_history: history });
  }, [user]);

  const markProfileAsComplete = useCallback(() => {
    if (user) saveUserData(user.id, { profile_complete: true });
    setProfileComplete(true);
  }, [user]);

  const markTourAsComplete = useCallback(() => {
    if (user) saveUserData(user.id, { onboarding_complete: true });
    setTourComplete(true);
  }, [user]);
  
  const signOut = useCallback(async () => {
    await supabaseSignOut();
    clearState();
    // The onAuthStateChange listener will handle setting session/user to null
  }, [clearState]);

  const value = {
    session, user, meals, exercises, waterLogs, dailyGoal, userProfile, savedRecipes, dailyInsight,
    chatHistory, setChatHistory: handleSetChatHistory, unlockedAchievements, setUnlockedAchievements: handleSetUnlockedAchievements,
    todaysNutrition, todaysWaterIntake, currentStreak, todaysCaloriesBurned, dataLoaded, profileComplete, tourComplete,
    addMeal, updateMeal, deleteMeal, setDailyGoal: handleSetDailyGoal, setUserProfile: handleSetUserProfile,
    addWeightEntry, addExercise, deleteExercise, addWaterLog, addRecipe, deleteRecipe,
    theme, setTheme: handleSetTheme, markProfileAsComplete, markTourAsComplete, signOut
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
