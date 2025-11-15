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
import Card from './components/common/Card';

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
const UpdateMealWithPhoto = React.lazy(() => import('./components/UpdateMealWithPhoto'));
const ShareSummaryModal = React.lazy(() => import('./components/ShareSummaryModal'));


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
    mealToUpdateWithPhoto,
    summaryToShare,
  } = useUI();
  
  const {
    dataLoaded,
    userId,
    meals,
    dailyGoal,
    unlockedAchievements,
    setUnlockedAchievements,
    currentStreak,
    setUserProfile,
    setDailyGoal,
    markProfileAsComplete,
    markTourAsComplete,
  } = useData();
  
  const handleOnboardingComplete = (profile: UserProfile, goals: NutritionInfo) => {
    setUserProfile(profile);
    setDailyGoal(goals);
    markProfileAsComplete();
    setActiveModal(null);
  };
  
  const handleTourComplete = () => {
    markTourAsComplete();
    setActiveModal(null);
  };

  useEffect(() => {
    if (!dataLoaded || !userId) return;
    const justUnlocked = checkAchievements(meals, dailyGoal, unlockedAchievements);
    if (justUnlocked.length > 0) {
      const newIds = justUnlocked.map(a => a.id);
      setUnlockedAchievements(prev => new Set([...prev, ...newIds]));
      setNewlyUnlocked(justUnlocked[0]);
    }
  }, [meals, dailyGoal, unlockedAchievements, setUnlockedAchievements, setNewlyUnlocked, dataLoaded, userId]);

  useEffect(() => {
    if (!dataLoaded || !userId) return;
    const milestones = [3, 7, 14, 30, 50, 100];
    if (currentStreak > 0) {
      const milestone = milestones.find(m => currentStreak === m);
      if (milestone) setStreakMilestone(milestone);
    }
  }, [currentStreak, setStreakMilestone, dataLoaded, userId]);


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
      case 'updateMealPhoto': return mealToUpdateWithPhoto ? <UpdateMealWithPhoto meal={mealToUpdateWithPhoto} /> : null;
      case 'liveCoach': return <LiveCoachModal />;
      case 'recipeBox': return <RecipeBoxModal />;
      case 'shareSummary': return summaryToShare ? <ShareSummaryModal summary={summaryToShare} /> : null;
      default: return null;
    }
  };

  if (!dataLoaded) {
    return (
        <main className="h-screen w-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <Loader text="Loading VisionCal..." />
        </main>
    );
  }

  // Main App Body
  return (
    <>
      <main className="h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <Dashboard />
        </div>
        <nav className="fixed inset-x-4 bottom-4 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200/80 dark:border-gray-700/80 md:relative md:inset-auto md:z-auto md:bg-transparent dark:md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:border-0 md:border-l md:border-gray-200 dark:md:border-gray-800 md:order-last">
          <div className="flex justify-around items-center h-20 md:h-full md:flex-col md:w-24 md:py-8">
            <button onClick={() => setActiveModal('logExercise')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                 <Icon path="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-1.383-.598 18.468 18.468 0 01-5.734-4.97m5.734-4.97a16.824 16.824 0 00-5.734-4.97m5.734 4.97l4.318 4.318a4.5 4.5 0 006.364-6.364l-4.318-4.318a4.5 4.5 0 00-6.364 6.364zm10.606-10.607a4.5 4.5 0 00-6.364 0l-4.318 4.318a4.5 4.5 0 000 6.364l4.318 4.318a4.5 4.5 0 006.364-6.364l-4.318-4.318z" className="w-7 h-7" />
                 <span className="text-xs font-semibold">Activity</span>
            </button>
             <button onClick={() => setActiveModal('checker')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-7 h-7" />
                <span className="text-xs font-semibold">Checker</span>
            </button>
            <button onClick={() => setActiveModal('log')} className="flex-1 flex flex-col items-center justify-center gap-1 text-white bg-teal-500 rounded-full w-16 h-16 shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-colors md:w-20 md:h-20 md:rounded-3xl">
              <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-8 h-8" />
            </button>
            <button onClick={() => setActiveModal('chat')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-7 h-7" />
                <span className="text-xs font-semibold">AI Coach</span>
            </button>
             <button onClick={() => setActiveModal('profile')} className="group flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <Icon path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" className="w-7 h-7" />
                <span className="text-xs font-semibold">Profile</span>
            </button>
          </div>
        </nav>
      </main>
      <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><Loader /></div>}>
        {renderActiveModal()}
      </Suspense>
      {newlyUnlocked && <Toast achievement={newlyUnlocked} onClose={() => setNewlyUnlocked(null)} />}
      {toastMessage && <SimpleToast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {streakMilestone && <StreakMilestoneToast milestone={streakMilestone} onClose={() => setStreakMilestone(null)} />}
    </>
  );
};

export default App;