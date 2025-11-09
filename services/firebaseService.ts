import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { getFirebaseConfig } from '../firebaseConfig';
import type { UserProfile, Meal, NutritionInfo, Exercise } from '../types';

// --- Initialize Firebase ---
// Eager initialization is simpler and more robust for this app's structure.
const firebaseConfig = getFirebaseConfig();
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // If initialization fails, auth and db will be undefined, and functions will gracefully handle it.
}

// --- Authentication ---
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error("Firebase Auth is not available.");
    // Immediately call back with null to signal no user.
    callback(null);
    return () => {}; // Return an empty unsubscribe function
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      // If no user, sign in anonymously
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        callback(null); // Signal sign-in failure
      });
    }
  });
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
        userProfile: UserProfile;
        dailyGoal: NutritionInfo;
        unlockedAchievements: string[];
        theme: 'light' | 'dark' | 'system'
    }>('users', userId);
    return data;
}

export const saveMeals = async (userId: string, meals: Meal[]) => {
    await setDocument('users', userId, { meals });
}

export const saveExercises = async (userId: string, exercises: Exercise[]) => {
    await setDocument('users', userId, { exercises });
}

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
