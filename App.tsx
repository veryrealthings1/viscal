import React, { Suspense, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Toast from './components/common/Toast';
import Icon from './components/common/Icon';
import SimpleToast from './components/common/SimpleToast';
import StreakMilestoneToast from './components/common/StreakMilestoneToast';
import { useUI } from './hooks/useUI';
import Loader from './components/common/Loader';
import { useData } from './hooks/useData';
import type { UserProfile, NutritionInfo } from './types';
import { checkAchievements } from './services/achievements';

// Lazy load all modal components for performance
const FoodLogger = React.lazy(() => import('./components/FoodLogger'));
const NutritionChat = React.lazy(() => import('./components/NutritionChat'));
const Achievements = React.lazy(() => import('./components/Achievements'));
const FoodChecker = React.lazy(() => import('./components/FoodChecker'));
const Profile = React.lazy(() => import('./components/Profile'));
const FeatureTour = React.lazy(() => import('./components/FeatureTour'));
const ProfileOnboarding = React.lazy(() => import('./components/ProfileOnboarding'));
const Diary = React.lazy(() => import('./components/Diary'));
const WeeklyInsights = React.lazy(() => import('./components/WeeklyInsights'));
const Trends = React.lazy(() => import('./components/Trends'));
const RecipeModal = React.lazy(() => import('./components/RecipeModal'));
const EditMealModal = React.lazy(() => import('./components/EditMealModal'));
const LogExercise = React.lazy(() => import('./components/LogExercise'));
const LiveCoachModal = React.lazy(() => import('./components/LiveCoachModal'));
const RecipeBoxModal = React.lazy(() => import('./components/RecipeBoxModal'));


const App: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    newlyUnlocked,
    setNewlyUnlocked,
    toastMessage,
    setToastMessage,
    streakMilestone,
    setStreakMilestone,
    recipe,
    mealToEdit,
  } = useUI();
  
  const {
    dataLoaded,
    meals,
    dailyGoal,
    unlockedAchievements,
    setUnlockedAchievements,
    currentStreak,
    setUserProfile,
    setDailyGoal,
  } = useData();
  
  const handleOnboardingComplete = (profile: UserProfile, goals: NutritionInfo) => {
    setUserProfile(profile);
    setDailyGoal(goals);
    localStorage.setItem('visioncal-profileComplete', 'true');
    setActiveModal(null);
  };
  
  const handleTourComplete = () => {
    localStorage.setItem('visioncal-tourComplete', 'true');
    setActiveModal(null);
  };

  useEffect(() => {
    if (!dataLoaded) return;
    const justUnlocked = checkAchievements(meals, dailyGoal, unlockedAchievements);
    if (justUnlocked.length > 0) {
      const newIds = justUnlocked.map(a => a.id);
      setUnlockedAchievements(prev => new Set([...prev, ...newIds]));
      setNewlyUnlocked(justUnlocked[0]);
    }
  }, [meals, dailyGoal, unlockedAchievements, setUnlockedAchievements, setNewlyUnlocked, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    const milestones = [3, 7, 14, 30, 50, 100];
    if (currentStreak > 0) {
      const milestone = milestones.find(m => currentStreak === m);
      if (milestone) setStreakMilestone(milestone);
    }
  }, [currentStreak, setStreakMilestone, dataLoaded]);


  const renderActiveModal = () => {
    switch (activeModal) {
      case 'log': return <FoodLogger />;
      case 'logExercise': return <LogExercise />;
      case 'chat': return <NutritionChat />;
      case 'achievements': return <Achievements unlockedIds={unlockedAchievements} onClose={() => setActiveModal(null)} />;
      case 'checker': return <FoodChecker />;
      case 'profile': return <Profile />;
      case 'onboarding': return <ProfileOnboarding onComplete={handleOnboardingComplete} />;
      case 'tour': return <FeatureTour onComplete={handleTourComplete} />;
      case 'diary': return <Diary />;
      case 'insights': return <WeeklyInsights />;
      case 'trends': return <Trends />;
      case 'recipe': return recipe ? <RecipeModal recipe={recipe} /> : null;
      case 'editMeal': return mealToEdit ? <EditMealModal meal={mealToEdit} /> : null;
      case 'liveCoach': return <LiveCoachModal />;
      case 'recipeBox': return <RecipeBoxModal />;
      default: return null;
    }
  };

  // Main App Body
  return (
    <main className="h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      <div className="flex-1 overflow-y-auto">
        {!dataLoaded && (
          <div className="flex items-center justify-center h-full">
            <Loader text="Loading your data..." />
          </div>
        )}
        {dataLoaded && <Dashboard />}
      </div>
      <nav className="border-t border-gray-200 dark:border-gray-800 md:border-t-0 md:border-l order-first md:order-last">
        <div className="flex justify-around items-center h-20 md:h-full md:flex-col md:w-24 md:py-8">
          <button onClick={() => setActiveModal('log')} className="flex-1 flex flex-col items-center justify-center gap-1 text-white bg-teal-500 rounded-full w-16 h-16 shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-colors md:w-20 md:h-20 md:rounded-3xl">
            <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-8 h-8" />
          </button>
           <button onClick={() => setActiveModal('diary')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
              <Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" className="w-7 h-7" />
              <span className="text-xs font-semibold">Diary</span>
          </button>
           <button onClick={() => setActiveModal('trends')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
               <Icon path="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.517l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" className="w-7 h-7" />
               <span className="text-xs font-semibold">Trends</span>
           </button>
           <button onClick={() => setActiveModal('profile')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
              <Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" className="w-7 h-7" />
              <span className="text-xs font-semibold">Profile</span>
          </button>
        </div>
      </nav>
      <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><Loader /></div>}>
        {renderActiveModal()}
      </Suspense>
      {newlyUnlocked && <Toast achievement={newlyUnlocked} onClose={() => setNewlyUnlocked(null)} />}
      {toastMessage && <SimpleToast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {streakMilestone && <StreakMilestoneToast milestone={streakMilestone} onClose={() => setStreakMilestone(null)} />}
    </main>
  );
};

export default App;