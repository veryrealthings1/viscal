import React, { useMemo } from 'react';
import type { Meal, NutritionInfo, UserProfile } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import HistoryChart from './HistoryChart';
import RingProgress from './common/RingProgress';
import MealSuggestions from './MealSuggestions';
import HydrationTracker from './HydrationTracker';
import AIInsight from './AIInsight';
import { nutrientMetadata, limitNutrients } from '../services/utils';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const DetailNutrient: React.FC<{ label: string, value: number, goal: number, unit: string, nutrientKey: keyof NutritionInfo }> = React.memo(({ label, value, goal, unit, nutrientKey }) => {
    const progress = goal > 0 ? (value / goal) * 100 : 0;
    const isLimit = limitNutrients.has(nutrientKey);

    let barColor = 'bg-teal-400 dark:bg-teal-500';
    let icon = null;
    let valueColor = 'text-gray-500 dark:text-gray-400';
    const progressWidth = Math.min(progress, 100);

    if (isLimit) { // Nutrient to limit
        if (progress >= 100) {
            barColor = 'bg-red-400 dark:bg-red-500';
            icon = <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-4 h-4 text-red-500" />;
            valueColor = 'text-red-600 dark:text-red-400 font-semibold';
        } else if (progress >= 80) {
            barColor = 'bg-amber-400 dark:bg-amber-500';
        }
    } else { // Nutrient to achieve
        if (progress >= 100) {
            barColor = 'bg-emerald-400 dark:bg-emerald-500';
            icon = <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-emerald-500" />;
            valueColor = 'text-emerald-600 dark:text-emerald-400 font-semibold';
        }
    }

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-1.5">
                    {icon && <div className="w-4 h-4">{icon}</div>}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                </div>
                <span className={`text-xs transition-colors ${valueColor}`}>{Math.round(value)}{unit} / {goal > 0 ? goal : '-'}{unit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${progressWidth}%`, transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out' }}></div>
            </div>
        </div>
    );
});


const Dashboard: React.FC = () => {
  const { meals, dailyGoal, userProfile, todaysNutrition, todaysCaloriesBurned, currentStreak } = useData();
  const { setActiveModal } = useUI();

  const getChartData = useMemo(() => {
    const data: { day: string; calories: number }[] = [];
    const today = new Date();
    const dayMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({ day: dayName, calories: 0 });
      dayMap.set(dayKey, 6 - i);
    }
    
    meals.forEach(meal => {
        const mealDayKey = meal.date.split('T')[0];
        if(dayMap.has(mealDayKey)) {
            const index = dayMap.get(mealDayKey)!;
            data[index].calories += meal.nutrition.calories;
        }
    });

    return data;
  }, [meals]);

  const detailedNutrients = useMemo(() => Object.keys(nutrientMetadata)
    .map(key => {
        const nutrientKey = key as keyof NutritionInfo;
        return {
            key: nutrientKey,
            label: nutrientMetadata[key].label,
            value: todaysNutrition[nutrientKey],
            goal: dailyGoal[nutrientKey],
            unit: nutrientMetadata[key].unit,
        };
    })
    .filter(n => n.goal !== undefined && n.goal > 0), [todaysNutrition, dailyGoal]);
  
  const getProgressColor = (value: number, goal: number, isLimit: boolean) => {
    if (goal <= 0) return 'bg-gray-400';
    const progress = (value / goal) * 100;
    if (isLimit) {
        if (progress >= 100) return 'bg-red-500';
        if (progress >= 80) return 'bg-amber-500';
        return 'bg-teal-500';
    } else {
        if (progress >= 100) return 'bg-emerald-500';
        if (progress < 50) return 'bg-rose-500';
        return 'bg-sky-500';
    }
  };

  const caloriesColor = getProgressColor(todaysNutrition.calories, dailyGoal.calories, true);
  const proteinColor = getProgressColor(todaysNutrition.protein, dailyGoal.protein, false);
  const carbsColor = getProgressColor(todaysNutrition.carbs, dailyGoal.carbs, true);
  const fatColor = getProgressColor(todaysNutrition.fat, dailyGoal.fat, true);
  
  let streakStyles = {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800',
    textColor: 'text-gray-700 dark:text-gray-200',
    iconColor: 'text-gray-500 dark:text-gray-400',
    subtitle: 'Log a meal to start a streak!',
  };

  if (currentStreak > 0) {
    if (currentStreak >= 30) { // Epic
      streakStyles = {
        bg: 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20',
        textColor: 'text-white',
        iconColor: 'text-purple-200',
        subtitle: "Incredible commitment!",
      };
    } else if (currentStreak >= 7) { // Rare
      streakStyles = {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20',
        textColor: 'text-white',
        iconColor: 'text-amber-200',
        subtitle: "You're on fire!",
      };
    } else { // Common
      streakStyles = {
        bg: 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/20',
        textColor: 'text-white',
        iconColor: 'text-teal-100',
        subtitle: currentStreak > 1 ? "Great consistency!" : "Day 1, let's go!",
      };
    }
  }

  const loggedDaysCount = new Set(meals.map(m => m.date.split('T')[0])).size;
  const netCalories = todaysNutrition.calories - todaysCaloriesBurned;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center gap-4 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Today</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back!</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setActiveModal('liveCoach')} className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg dark:shadow-black/20 text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400">
                <Icon path="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" className="w-6 h-6"/>
            </button>
            <button onClick={() => setActiveModal('logExercise')} className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg dark:shadow-black/20 text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400">
                <Icon path="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-1.383-.598 18.468 18.468 0 01-5.734-4.97m5.734-4.97a16.824 16.824 0 00-5.734-4.97m5.734 4.97l4.318 4.318a4.5 4.5 0 006.364-6.364l-4.318-4.318a4.5 4.5 0 00-6.364 6.364zm10.606-10.607a4.5 4.5 0 00-6.364 0l-4.318 4.318a4.5 4.5 0 000 6.364l4.318 4.318a4.5 4.5 0 006.364-6.364l-4.318-4.318z" className="w-6 h-6"/>
            </button>
            <button onClick={() => setActiveModal('chat')} className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg dark:shadow-black/20 text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400">
                <Icon path="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6"/>
            </button>
             <button onClick={() => setActiveModal('checker')} className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg dark:shadow-black/20 text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400">
                <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-6 h-6"/>
            </button>
        </div>
      </header>
      
      <AIInsight />

      <Card className={`p-6 flex items-center gap-6 transition-all duration-500 ${streakStyles.bg}`}>
        <div className={`relative ${currentStreak > 0 ? 'animate-pulse-fire' : ''}`}>
          <Icon path="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z" className={`w-16 h-16 ${streakStyles.iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-6xl font-black ${streakStyles.textColor}`}>{currentStreak}</p>
          <p className={`text-lg font-bold tracking-wider -mt-2 ${streakStyles.textColor}`}>DAY STREAK</p>
          <p className={`text-sm mt-1 opacity-80 ${streakStyles.textColor}`}>{streakStyles.subtitle}</p>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col items-center justify-center">
            <RingProgress 
              value={todaysNutrition.calories}
              goal={dailyGoal.calories}
              label="Consumed"
              unit="kcal"
              size={120}
              color={caloriesColor}
            />
            <div className="text-center -mt-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    - {Math.round(todaysCaloriesBurned)} Burned
                </p>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                    = {Math.round(netCalories)} Net
                </p>
            </div>
          </Card>
           <Card className="p-4 flex flex-col items-center justify-center">
            <RingProgress 
              value={todaysNutrition.protein}
              goal={dailyGoal.protein}
              label="Protein"
              unit="g"
              size={120}
              color={proteinColor}
            />
          </Card>
           <Card className="p-4 flex flex-col items-center justify-center">
            <RingProgress 
              value={todaysNutrition.carbs}
              goal={dailyGoal.carbs}
              label="Carbs"
              unit="g"
              size={120}
              color={carbsColor}
            />
          </Card>
           <Card className="p-4 flex flex-col items-center justify-center">
            <RingProgress 
              value={todaysNutrition.fat}
              goal={dailyGoal.fat}
              label="Fat"
              unit="g"
              size={120}
              color={fatColor}
            />
          </Card>
      </div>

      <HydrationTracker />

      <MealSuggestions />

      {loggedDaysCount >= 3 && (
        <Card onClick={() => setActiveModal('insights')} className="cursor-pointer group hover:bg-teal-500/10 dark:hover:bg-teal-900/40 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-8 h-8 text-teal-500 dark:text-teal-300"/>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Report</h2>
                <p className="text-gray-500 dark:text-gray-400">Get personalized insights from your week.</p>
            </div>
            <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-6 h-6 ml-auto text-gray-400 group-hover:text-teal-500 transition-colors" />
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">7-Day History</h2>
        <HistoryChart data={getChartData} dailyGoal={dailyGoal.calories}/>
      </Card>
      
      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Detailed Nutrients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {detailedNutrients.map(n => (
                <DetailNutrient 
                    key={n.key}
                    label={n.label}
                    value={n.value ?? 0}
                    goal={n.goal ?? 0}
                    unit={n.unit}
                    nutrientKey={n.key}
                />
            ))}
        </div>
      </Card>
      <style>{`
        @keyframes pulse-fire {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(255, 165, 0, 0.4)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(255, 165, 0, 0.7)); }
        }
        .animate-pulse-fire {
          animation: pulse-fire 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;