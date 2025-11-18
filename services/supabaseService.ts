
import { createClient, SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { UserProfile, Meal, NutritionInfo, Exercise, WaterLog, Recipe, ChatMessage } from '../types';

// --- Configuration & State ---
// Fallback credentials provided by user for this instance.
const PROVIDED_SUPABASE_URL = "https://ucfuofovxeejipocjqhg.supabase.co";
const PROVIDED_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZnVvZm92eGVlamlwb2NqcWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTY4MTMsImV4cCI6MjA3ODI3MjgxM30.XtY2ViWzkQH6TieXdeNkaLZkvn1GAWMyKX8DeuEDpyg";

const isSupabaseAvailable = (!!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY) || (!!PROVIDED_SUPABASE_URL && !!PROVIDED_SUPABASE_KEY);
let supabase: SupabaseClient;

// Local Storage Keys for Mock Mode
const MOCK_SESSION_KEY = 'visioncal_mock_session';
const MOCK_DB_KEY_PREFIX = 'visioncal_mock_db_';

const getSupabase = (): SupabaseClient => {
    if (!supabase && isSupabaseAvailable) {
        const url = process.env.SUPABASE_URL || PROVIDED_SUPABASE_URL;
        const key = process.env.SUPABASE_KEY || PROVIDED_SUPABASE_KEY;
        supabase = createClient(url, key);
    }
    return supabase;
};

// Helper for mock responses
const mockResponse = <T>(data: T | null, error: any = null) => Promise.resolve({ data, error });

// Helper to identify local guest users
const isLocalUser = (userId: string) => userId.startsWith('local_user_');

// --- Types & Mappers ---
interface UserDataRow {
    id: string;
    meals?: Meal[];
    exercises?: Exercise[];
    water_logs?: WaterLog[];
    saved_recipes?: Recipe[];
    user_profile?: UserProfile;
    daily_goal?: NutritionInfo;
    unlocked_achievements?: string[];
    theme?: 'light' | 'dark' | 'system';
    chat_history?: ChatMessage[];
    profile_complete?: boolean;
    onboarding_complete?: boolean;
}

const mapRowToState = (row: UserDataRow) => ({
    meals: row.meals || [],
    exercises: row.exercises || [],
    waterLogs: row.water_logs || [],
    savedRecipes: row.saved_recipes || [],
    userProfile: row.user_profile,
    dailyGoal: row.daily_goal,
    unlockedAchievements: row.unlocked_achievements || [],
    theme: row.theme,
    chatHistory: row.chat_history,
    profileComplete: row.profile_complete,
    tourComplete: row.onboarding_complete,
});

const defaultEmptyState = {
    meals: [],
    exercises: [],
    waterLogs: [],
    savedRecipes: [],
    unlockedAchievements: [],
    userProfile: undefined,
    dailyGoal: undefined,
    theme: undefined,
    chatHistory: undefined,
    profileComplete: false,
    tourComplete: false,
};

// --- Mock Helpers ---
type AuthStateCallback = (event: string, session: any) => void;
const authListeners = new Set<AuthStateCallback>();

const notifyAuthListeners = (event: string, session: any) => {
    authListeners.forEach(cb => cb(event, session));
};

const getLocalData = (userId: string): Partial<UserDataRow> => {
    try {
        const data = localStorage.getItem(MOCK_DB_KEY_PREFIX + userId);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
};

const setLocalData = (userId: string, data: Partial<UserDataRow>) => {
    const current = getLocalData(userId);
    const updated = { ...current, ...data };
    localStorage.setItem(MOCK_DB_KEY_PREFIX + userId, JSON.stringify(updated));
    return updated;
};


// --- Auth Functions ---

export const signUp = (email, password) => {
    if (isSupabaseAvailable) return getSupabase().auth.signUp({ email, password });
    
    // Mock behavior
    const user = { id: 'local_user_' + Date.now(), email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() };
    const session = { access_token: 'mock_token', token_type: 'bearer', user, expires_in: 3600, refresh_token: 'mock_refresh' };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    notifyAuthListeners('SIGNED_IN', session);
    return mockResponse({ user, session }, null);
};

export const signIn = async (email, password) => {
    // FORCE MOCK for specific guest account to avoid shared DB issues and ensuring demo always works locally.
    if (email === 'guest@visioncal.app') {
         const user = { id: 'local_user_guest', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() };
         const session = { access_token: 'mock_token_guest', token_type: 'bearer', user, expires_in: 3600, refresh_token: 'mock_refresh_guest' };
         localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
         notifyAuthListeners('SIGNED_IN', session);
         return mockResponse({ user, session }, null);
    }

    if (isSupabaseAvailable) {
        const response = await getSupabase().auth.signInWithPassword({ email, password });
        return response;
    }

    // Mock behavior for other local users if Supabase not avail
    const user = { id: 'local_user_default', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() };
    const session = { access_token: 'mock_token', token_type: 'bearer', user, expires_in: 3600, refresh_token: 'mock_refresh' };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    notifyAuthListeners('SIGNED_IN', session);
    return mockResponse({ user, session }, null);
};

export const signOut = () => {
    if (isSupabaseAvailable) return getSupabase().auth.signOut();

    localStorage.removeItem(MOCK_SESSION_KEY);
    notifyAuthListeners('SIGNED_OUT', null);
    return mockResponse(null, null);
};

export const resetPassword = (email: string) => {
    if (isSupabaseAvailable) return getSupabase().auth.resetPasswordForEmail(email);
    // Mock: always success
    return mockResponse({}, null);
};

export const onAuthStateChange = (callback: AuthStateCallback) => {
    if (isSupabaseAvailable) return getSupabase().auth.onAuthStateChange(callback);

    authListeners.add(callback);
    // Immediate callback with current state to mimic behavior
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0);

    return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
};

export const getSession = () => {
    if (isSupabaseAvailable) return getSupabase().auth.getSession();
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    return mockResponse({ session }, null);
};


// --- Data Functions ---

export const getUserData = async (userId: string) => {
    // If this is a local guest user, skip Supabase to avoid foreign key errors
    if (isLocalUser(userId)) {
        const data = getLocalData(userId);
        return mapRowToState({ id: userId, ...data });
    }

    if (isSupabaseAvailable) {
        try {
            const { data, error } = await getSupabase()
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116 is the error code for "Row not found" when using .single()
                if (error.code === 'PGRST116') { 
                    // User does not exist in DB, create default
                    const defaultData = { id: userId };
                    const { error: insertError } = await getSupabase().from('users').insert(defaultData);
                    if (insertError) {
                        // Check for missing table error
                        if (insertError.code === '42P01' || insertError.code === 'PGRST205') {
                             console.warn("Supabase 'users' table missing. Falling back to local storage.");
                             return mapRowToState({ id: userId, ...getLocalData(userId) });
                        }
                        console.error('Error creating new user row:', JSON.stringify(insertError));
                        // Fallback to empty state if insert fails
                        return { ...defaultEmptyState };
                    }
                    return { ...defaultEmptyState };
                }
                
                // Check for missing table error (PGRST205 or 42P01)
                if (error.code === 'PGRST205' || error.code === '42P01') {
                    console.warn("Supabase 'users' table missing. Falling back to local storage.");
                    return mapRowToState({ id: userId, ...getLocalData(userId) });
                }

                console.error('Error fetching user data (falling back to local):', JSON.stringify(error));
                // Fallback to local if remote fetch fails (e.g. network, permissions, or table missing)
                return mapRowToState({ id: userId, ...getLocalData(userId) });
            }
            
            if (data) return mapRowToState(data);

        } catch (e) {
            console.error("Unexpected error in getUserData:", e);
            // Fail safe
            return mapRowToState({ id: userId, ...getLocalData(userId) });
        }
    }

    // Mock Implementation Fallback
    const data = getLocalData(userId);
    return mapRowToState({ id: userId, ...data });
};

export const saveUserData = async (userId: string, dataToSave: Partial<UserDataRow>): Promise<void> => {
    // Always save to local storage as backup/cache
    setLocalData(userId, dataToSave);

    // If this is a local guest user, skip Supabase
    if (isLocalUser(userId)) return;

    if (isSupabaseAvailable) {
        try {
            // Use upsert to handle cases where row might be missing despite getUserData running earlier.
            // This makes persistence much more robust.
            const { error } = await getSupabase()
                .from('users')
                .upsert({ id: userId, ...dataToSave });
            
            if (error) {
                console.warn(`Error saving user data for ${userId}:`, JSON.stringify(error));
            }
        } catch (error) {
            console.error(`Unexpected error saving user data for ${userId}:`, error);
        }
    }
};

export const deleteUserData = async (userId: string): Promise<void> => {
    // If this is a local guest user, skip Supabase
    if (isLocalUser(userId)) {
        localStorage.removeItem(MOCK_DB_KEY_PREFIX + userId);
        return;
    }

    if (isSupabaseAvailable) {
        try {
            const { error } = await getSupabase()
                .from('users')
                .delete()
                .eq('id', userId);
            if (error) throw error;
        } catch (error) {
            console.error(`Error deleting user data for ${userId}:`, error);
            throw error;
        }
        return;
    }
    
    // Mock Implementation
    localStorage.removeItem(MOCK_DB_KEY_PREFIX + userId);
};
