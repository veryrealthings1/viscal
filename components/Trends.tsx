import React, { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import type { UserProfile } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import ConsistencyHeatmap from './common/ConsistencyHeatmap';
import MacroBar from './common/MacroBar';

const WeightChart: React.FC<{ weightHistory: UserProfile['weightHistory'] }> = ({ weightHistory }) => {
    if (!weightHistory || weightHistory.length < 2) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Icon path="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.517l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Not enough data for weight trend.</p>
                <p className="text-sm">Log your weight in the Profile tab to see progress.</p>
            </div>
        );
    }
    
    const data = useMemo(() => weightHistory
        .map(p => ({ date: new Date(p.date), weight: p.weight }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-30), // Max 30 data points
        [weightHistory]);

    const minWeight = Math.min(...data.map(p => p.weight));
    const maxWeight = Math.max(...data.map(p => p.weight));
    const weightRange = maxWeight - minWeight;
    
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const dateRange = endDate.getTime() - startDate.getTime();

    const points = data.map(({ date, weight }) => {
        const x = dateRange > 0 ? ((date.getTime() - startDate.getTime()) / dateRange) * 100 : 50;
        const y = weightRange > 0.1 ? 100 - (((weight - minWeight) / weightRange) * 90 + 5) : 50;
        return { x, y, weight };
    });

    const pathD = points.reduce((acc, point, i) => {
        return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    return (
        <div className="h-48 relative mb-6">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d={pathD} fill="none" stroke="rgb(var(--color-primary))" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    // FIX: Replaced title attribute with SVG <title> child element for tooltip.
                    <circle key={i} cx={p.x} cy={p.y} r="1" fill="rgb(var(--color-primary))" className="cursor-pointer">
                        <title>{`${data[i].date.toLocaleDateString()}: ${p.weight}kg`}</title>
                    </circle>
                ))}
            </svg>
            <div className="absolute top-0 left-0 text-xs text-gray-500 dark:text-gray-400">{maxWeight.toFixed(1)} kg</div>
            <div className="absolute bottom-0 left-0 text-xs text-gray-500 dark:text-gray-400">{minWeight.toFixed(1)} kg</div>
            <div className="absolute -bottom-5 left-0 text-xs text-gray-500 dark:text-gray-400">{startDate.toLocaleDateString('en-us', {month: 'short', day: 'numeric'})}</div>
            <div className="absolute -bottom-5 right-0 text-xs text-gray-500 dark:text-gray-400">{endDate.toLocaleDateString('en-us', {month: 'short', day: 'numeric'})}</div>
        </div>
    );
};


const Trends: React.FC = () => {
  const { meals, userProfile } = useData();
  const { setActiveModal } = useUI();
  const onClose = () => setActiveModal(null);

  const weeklyAverages = useMemo(() => {
    const weeklyData = new Map<string, { days: Set<string>, calories: number, protein: number, carbs: number, fat: number }>();
    
    meals.forEach(meal => {
        const date = new Date(meal.date);
        const day = date.getUTCDay();
        const firstDayOfWeek = new Date(date.setDate(date.getUTCDate() - day));
        firstDayOfWeek.setUTCHours(0,0,0,0);
        const weekKey = firstDayOfWeek.toISOString().split('T')[0];

        if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { days: new Set(), calories: 0, protein: 0, carbs: 0, fat: 0 });
        }
        const weekEntry = weeklyData.get(weekKey)!;
        weekEntry.days.add(meal.date.split('T')[0]);
        weekEntry.calories += meal.nutrition.calories;
        weekEntry.protein += meal.nutrition.protein;
        weekEntry.carbs += meal.nutrition.carbs;
        weekEntry.fat += meal.nutrition.fat;
    });

    const averages = [];
    for (const [weekKey, data] of weeklyData.entries()) {
        const dayCount = data.days.size;
        if (dayCount > 0) {
            averages.push({
                week: weekKey,
                avgCalories: Math.round(data.calories / dayCount),
                avgProtein: Math.round(data.protein / dayCount),
                avgCarbs: Math.round(data.carbs / dayCount),
                avgFat: Math.round(data.fat / dayCount),
            });
        }
    }
    return averages.sort((a,b) => a.week.localeCompare(b.week)).slice(-4); // last 4 weeks
  }, [meals]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">Your Trends</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon path="M6 18L18 6M6 6l12 12" />
            </button>
        </header>
        
        <div className="flex-1 overflow-y-auto mt-4 space-y-6 p-1 pr-2">
           <Card>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Weight Trend</h3>
                <WeightChart weightHistory={userProfile.weightHistory} />
           </Card>

           {weeklyAverages.length > 0 && (
            <Card>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Weekly Averages</h3>
                <div className="space-y-4">
                    {weeklyAverages.map(week => (
                        <div key={week.week}>
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="text-sm font-semibold">{new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Week</p>
                                <p className="text-xs font-medium text-gray-500">{week.avgCalories} kcal / day</p>
                            </div>
                            <MacroBar protein={week.avgProtein} carbs={week.avgCarbs} fat={week.avgFat} />
                        </div>
                    ))}
                </div>
            </Card>
           )}

           <ConsistencyHeatmap meals={meals} />
        </div>
      </Card>
    </div>
  );
};

export default Trends;