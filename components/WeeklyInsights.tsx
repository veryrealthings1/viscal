import React, { useState, useEffect } from 'react';
import type { Meal, NutritionInfo, UserProfile, WeeklyInsight } from '../types';
import { getWeeklyInsight } from '../services/geminiService';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const InsightCard: React.FC<{
  item: { text: string; icon: string };
  type: 'win' | 'opportunity';
}> = ({ item, type }) => {
  const iconMap: Record<string, string> = {
    trophy: 'M16.5 18.75h-9a9.75 9.75 0 100-13.5h9a9.75 9.75 0 100 13.5z',
    star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385c.41 0 .622.512.3.786l-4.343 4.024a.563.563 0 00-.166.548l1.58 5.569c.192.678-.533 1.223-1.14 1.223l-4.782-2.32a.563.563 0 00-.528 0l-4.782 2.32c-.607 0-1.332-.545-1.14-1.223l1.58-5.569a.563.563 0 00-.166-.548l-4.343-4.024c-.322-.274-.11-.786.3-.786h5.385a.563.563 0 00.475-.321L11.48 3.5z',
    heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    seedling: 'M13.293 9.293a1.5 1.5 0 00-2.122 0l-1.5 1.5a1.5 1.5 0 102.122 2.122L13.293 9.293zM15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    chart: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m1.5 1.5l-1.5-1.5m1.5 1.5l1.5-1.5',
    target: 'M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  const colors = type === 'win'
    ? { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' }
    : { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' };
  
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-gray-800/80 rounded-xl">
      <div className={`p-2 rounded-full ${colors.bg}`}>
        <Icon path={iconMap[item.icon] || iconMap.star} className={`w-6 h-6 ${colors.text}`} />
      </div>
      <p className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 pt-1">{item.text}</p>
    </div>
  );
};

const WeeklyInsights: React.FC = () => {
  const { meals, userProfile, dailyGoal } = useData();
  const { setActiveModal } = useUI();
  const onClose = () => setActiveModal(null);
  
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoading(true);
      setError(null);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentMeals = meals.filter(m => new Date(m.date) >= sevenDaysAgo);

      if (recentMeals.length < 5) {
        setError("Not enough data for a meaningful report. Keep logging your meals!");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getWeeklyInsight(recentMeals, userProfile, dailyGoal);
        setInsight(result);
      } catch (e: any) {
        setError(e.message || "Could not generate your report.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsight();
  }, [meals, userProfile, dailyGoal]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
          <Icon path="M6 18L18 6M6 6l12 12" />
        </button>
        
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader text="Analyzing your week..." /></div>}
          {error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
          {insight && (
            <div className="space-y-6 animate-fade-in">
              <header className="text-center">
                <div className="inline-block p-3 bg-teal-100 dark:bg-teal-900 rounded-2xl mb-4">
                    <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-10 h-10 text-teal-500 dark:text-teal-300"/>
                </div>
                <h2 className="text-2xl font-bold">{insight.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{insight.summary}</p>
              </header>
              
              <div>
                <h3 className="font-bold text-lg mb-3">Key Wins</h3>
                <div className="space-y-3">
                    {insight.wins.map((win, i) => <InsightCard key={i} item={win} type="win" />)}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Growth Opportunities</h3>
                 <div className="space-y-3">
                    {insight.opportunities.map((opp, i) => <InsightCard key={i} item={opp} type="opportunity" />)}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl">
                 <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-indigo-200 dark:bg-indigo-800">
                        <Icon path="M16.023 9.348h4.992v-.001a.75.75 0 01.05.022l-.05-.022zM16.023 9.348h4.992v-.001a.75.75 0 01.05.022l-.05-.022zM16.023 9.348h4.992v-.001a.75.75 0 01.05.022l-.05-.022zM12 2.25a.75.75 0 01.75.75v.001a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM12 18a.75.75 0 01.75.75v.001a.75.75 0 01-1.5 0V18.75a.75.75 0 01.75-.75zM12 6.75a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Tip for Next Week</h4>
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mt-1">{insight.tipForNextWeek}</p>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WeeklyInsights;