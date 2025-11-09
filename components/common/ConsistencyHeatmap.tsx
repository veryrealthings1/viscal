import React from 'react';
import Card from './Card';
import type { Meal } from '../../types';

interface ConsistencyHeatmapProps {
  meals: Meal[];
}

const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ meals }) => {
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month
  const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1); // Start of 3 months ago

  const days: { date: Date; count: number }[] = [];
  let currentDate = new Date(startDate);
  
  const mealCountsByDate: { [key: string]: number } = meals.reduce((acc, meal) => {
    const dateStr = new Date(meal.date).toDateString();
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Populate days array
  while (currentDate <= endDate) {
    days.push({
      date: new Date(currentDate),
      count: mealCountsByDate[currentDate.toDateString()] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const firstDayOfMonth = startDate.getDay();

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700/60';
    if (count <= 1) return 'bg-teal-200 dark:bg-teal-800';
    if (count <= 3) return 'bg-teal-400 dark:bg-teal-600';
    return 'bg-teal-600 dark:bg-teal-400';
  };
  
  const monthLabels = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (3-i), 1);
      return d.toLocaleString('default', { month: 'short' });
  })

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Logging Consistency</h2>
      <div className="grid grid-cols-7 gap-1.5" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(7, minmax(0, 1fr))` }}>
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="w-4 h-4 rounded-sm" />
        ))}
        {days.map(({ date, count }, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-sm ${getColor(count)}`}
            title={`${date.toDateString()}: ${count} logs`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
        {monthLabels.map(label => <span key={label}>{label}</span>)}
      </div>
    </Card>
  );
};

export default ConsistencyHeatmap;