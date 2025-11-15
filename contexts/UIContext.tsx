import React, { createContext, useState, useEffect } from 'react';
// FIX: Import DailySummary from types.ts
import type { Achievement, Meal, Recipe, DailySummary } from '../types';
import { useData } from '../hooks/useData';

type ModalType = 'log' | 'chat' | 'achievements' | 'profile' | 'checker' | 'diary' | 'insights' | 'trends' | 'onboarding' | 'tour' | 'recipe' | 'editMeal' | 'logExercise' | 'liveCoach' | 'recipeBox' | 'updateMealPhoto' | 'shareSummary' | null;

interface UIContextType {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  
  toastMessage: string | null;
  showToast: (message: string) => void;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;

  newlyUnlocked: Achievement | null;
  setNewlyUnlocked: React.Dispatch<React.SetStateAction<Achievement | null>>;
  
  streakMilestone: number | null;
  setStreakMilestone: React.Dispatch<React.SetStateAction<number | null>>;

  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  recipe: Recipe | null;
  setRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;

  mealToEdit: Meal | null;
  setMealToEdit: React.Dispatch<React.SetStateAction<Meal | null>>;
  
  mealToUpdateWithPhoto: Meal | null;
  setMealToUpdateWithPhoto: React.Dispatch<React.SetStateAction<Meal | null>>;

  summaryToShare: DailySummary | null;
  setSummaryToShare: React.Dispatch<React.SetStateAction<DailySummary | null>>;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataContext = useData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [mealToUpdateWithPhoto, setMealToUpdateWithPhoto] = useState<Meal | null>(null);
  const [summaryToShare, setSummaryToShare] = useState<DailySummary | null>(null);

  
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  // Effect to manage onboarding flow
  useEffect(() => {
    if (dataContext?.dataLoaded) {
      // Avoid showing onboarding if another modal is already open
      if (activeModal) return;
      if (!dataContext.profileComplete) {
        setActiveModal('onboarding');
      } else if (!dataContext.tourComplete) {
        setActiveModal('tour');
      }
    }
  }, [dataContext?.dataLoaded, dataContext?.profileComplete, dataContext?.tourComplete, activeModal]);


  // Effect to apply theme to document
  useEffect(() => {
    const theme = dataContext?.theme ?? 'system';
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') root.classList.toggle('dark', e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [dataContext?.theme]);
  
  const value = {
    activeModal,
    setActiveModal,
    toastMessage,
    showToast,
    setToastMessage,
    newlyUnlocked,
    setNewlyUnlocked,
    streakMilestone,
    setStreakMilestone,
    theme: dataContext?.theme ?? 'system',
    setTheme: dataContext?.setTheme ?? (() => {}),
    recipe,
    setRecipe,
    mealToEdit,
    setMealToEdit,
    mealToUpdateWithPhoto,
    setMealToUpdateWithPhoto,
    summaryToShare,
    setSummaryToShare,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};