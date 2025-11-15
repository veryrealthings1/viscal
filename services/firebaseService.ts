import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';
import 'firebase/compat/performance';

import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { getAnalytics, logEvent, setUserId as setAnalyticsUserId } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFirebaseConfig } from '../firebaseConfig';
import type { UserProfile, Meal, NutritionInfo, Exercise, WaterLog, Recipe, ChatMessage } from '../types';

// --- Initialize Firebase ---
const firebaseConfig = getFirebaseConfig();
let app: firebase.app.App;
let db: Firestore | undefined;
let analytics: any; // Use 'any' to avoid build issues if Analytics isn't fully configured
let performance: any; // Use 'any' for Performance Monitoring

try {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
        performance = getPerformance(app);
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

// --- Event Tracking ---
export const trackEvent = (eventName: string, params?: { [key: string]: any }) => {
  if (!analytics) {
    console.warn("Firebase Analytics is not available. Event not tracked:", eventName, params);
    return;
  }
  logEvent(analytics, eventName, params);
};


// --- Firestore Service ---

// Generic function to get a document
export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  if (!db || !docId) return null;
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to set a document
export const setDocument = async <T extends object>(collectionName: string, docId: string, data: T): Promise<void> => {
    if (!db || !docId) return;
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error(`Error setting document ${docId} in ${collectionName}:`, error);
        throw error;
    }
};

// --- App Specific Data Functions ---
export const getUserData = async (userId: string) => {
    const data = await getDocument<{
        meals: Meal[];
        exercises: Exercise[];
        waterLogs: WaterLog[];
        savedRecipes: Recipe[];
        userProfile: UserProfile;
        dailyGoal: NutritionInfo;
        unlockedAchievements: string[];
        theme: 'light' | 'dark' | 'system';
        chatHistory?: ChatMessage[];
    }>('users', userId);
    return data;
}

export const saveMeals = async (userId: string, meals: Meal[]) => {
    await setDocument('users', userId, { meals });
}

export const saveExercises = async (userId: string, exercises: Exercise[]) => {
    await setDocument('users', userId, { exercises });
}

export const saveWaterLogs = async (userId: string, waterLogs: WaterLog[]) => {
    await setDocument('users', userId, { waterLogs });
};

export const saveSavedRecipes = async (userId: string, recipes: Recipe[]) => {
    await setDocument('users', userId, { savedRecipes: recipes });
};

export const saveUserProfile = async (userId: string, profile: UserProfile) => {
    await setDocument('users', userId, { userProfile: profile });
}

export const saveDailyGoal = async (userId: string, goal: NutritionInfo) => {
    await setDocument('users', userId, { dailyGoal: goal });
}

export const saveUnlockedAchievements = async (userId: string, achievements: string[]) => {
    await setDocument('users', userId, { unlockedAchievements: achievements });
}

export const saveTheme = async (userId: string, theme: 'light' | 'dark' | 'system') => {
    await setDocument('users', userId, { theme });
}

export const saveChatHistory = async (userId: string, history: ChatMessage[]) => {
    await setDocument('users', userId, { chatHistory: history });
}

export const saveOnboardingStatus = async (userId: string, status: { profileComplete?: boolean, tourComplete?: boolean }) => {
    const data: { [key: string]: boolean } = {};
    if (status.profileComplete !== undefined) data['profile_complete'] = status.profileComplete;
    if (status.tourComplete !== undefined) data['onboarding_complete'] = status.tourComplete;
    await setDocument('users', userId, data);
}

export const getOnboardingStatus = async (userId: string): Promise<{profileComplete: boolean, tourComplete: boolean}> => {
    const data = await getDocument<{ profile_complete?: boolean, onboarding_complete?: boolean }>('users', userId);
    return {
        profileComplete: data?.profile_complete ?? false,
        tourComplete: data?.onboarding_complete ?? false,
    };
};
