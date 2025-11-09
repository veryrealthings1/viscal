import React from 'react';

interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  percent: number;
  isHigh: boolean;
}

const NutrientBar: React.FC<NutrientBarProps> = ({ label, value, unit, percent, isHigh }) => {
  const barColor = isHigh ? 'bg-rose-500' : 'bg-sky-500';
  const textColor = isHigh ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {value.toLocaleString()}{unit} ({Math.round(percent)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className={`${barColor} h-2.5 rounded-full`} 
          style={{ width: `${Math.min(percent, 100)}%`, transition: 'width 0.5s ease-in-out' }}
        ></div>
      </div>
    </div>
  );
};

export default NutrientBar;
