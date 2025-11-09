import React from 'react';

interface RingProgressProps {
  value: number;
  goal: number;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
  color: string;
}

const RingProgress: React.FC<RingProgressProps> = ({
  value,
  goal,
  label,
  unit,
  size = 120,
  strokeWidth = 10,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  const offset = circumference - progress * circumference;

  const textColor = color.replace('bg-', 'text-');
  const ringColor = color.replace('bg-', 'stroke-');

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          className="stroke-gray-200 dark:stroke-gray-700"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          className={`${ringColor} transition-all duration-500 ease-out`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-xl font-extrabold ${textColor}`}>{Math.round(value)}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 -mt-1">{label}</span>
      </div>
    </div>
  );
};

export default React.memo(RingProgress);