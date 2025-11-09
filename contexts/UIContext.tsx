import React, { createContext, useState, useEffect } from 'react';
import type { Achievement, Meal, Recipe } from '../types';
import { useData } from '../hooks/useData';

type ModalType = 'log' | 'chat' | 'achievements' | 'profile' | 'checker' | 'diary' | 'insights' | 'trends' | 'onboarding' | 'tour' | 'recipe' | 'editMeal' | 'logExercise' | 'liveCoach' | 'recipeBox' | null;

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
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataContext = useData(); // Use the hook at the top level

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [theme, rawSetTheme] = useState<'light' | 'dark' | 'system'>(() => {
      return (localStorage.getItem('visioncal-theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
      rawSetTheme(newTheme);
      localStorage.setItem('visioncal-theme', newTheme);
  }

  // Effect to manage onboarding flow
  useEffect(() => {
    if (dataContext?.dataLoaded) {
      const profileComplete = localStorage.getItem('visioncal-profileComplete') === 'true';
      const tourComplete = localStorage.getItem('visioncal-tourComplete') === 'true';
      
      if (!profileComplete) {
        setActiveModal('onboarding');
      } else if (!tourComplete) {
        setActiveModal('tour');
      }
    }
  }, [dataContext?.dataLoaded]);

  // Effect to apply theme to document
  useEffect(() => {
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
  }, [theme]);
  
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
    theme,
    setTheme,
    recipe,
    setRecipe,
    mealToEdit,
    setMealToEdit,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};