import React from 'react';

interface HistoryChartProps {
  data: {
    day: string;
    calories: number;
  }[];
  dailyGoal: number;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data, dailyGoal }) => {
  let maxCalories = Math.max(...data.map(d => d.calories), dailyGoal);

  if (maxCalories === 0) {
    maxCalories = dailyGoal > 0 ? dailyGoal * 1.2 : 2000;
  } else {
    maxCalories *= 1.1;
  }
  
  const goalLinePosition = (dailyGoal / maxCalories) * 100;

  return (
    <div className="w-full h-64 p-4 flex flex-col">
        <div className="flex-1 relative">
            {dailyGoal > 0 && (
                 <div className="absolute w-full border-t-2 border-dashed border-amber-500/70" style={{ bottom: `${goalLinePosition}%` }}>
                    <span className="absolute right-0 -translate-y-1/2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded">
                        GOAL
                    </span>
                 </div>
            )}
           
            <div className="h-full flex justify-around items-end gap-2 md:gap-4">
                {data.map((item, index) => {
                    const barHeight = item.calories > 0 ? Math.max((item.calories / maxCalories) * 100, 2) : 0;
                    const isToday = index === data.length - 1;
                    return (
                        <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2.5 relative -top-1 shadow-lg">
                                {Math.round(item.calories)} kcal
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                            </div>
                            <div
                                className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-teal-500 to-emerald-400' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-teal-400'}`}
                                style={{ height: `${barHeight}%` }}
                            />
                        </div>
                    );
                })}
            </div>
             {/* Y-Axis Line */}
            <div className="absolute top-0 bottom-0 left-[-8px] w-px bg-gray-200 dark:bg-gray-700"></div>
        </div>
        {/* X-Axis Labels */}
        <div className="h-6 flex justify-around items-center border-t border-gray-200 dark:border-gray-700 mt-2">
            {data.map((item, index) => (
                <div key={item.day} className={`flex-1 text-center text-xs font-medium ${index === data.length - 1 ? 'text-teal-600 dark:text-teal-300 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.day}
                </div>
            ))}
        </div>
    </div>
  );
};

export default React.memo(HistoryChart);