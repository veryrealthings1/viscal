import React from 'react';

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

const MacroBar: React.FC<MacroBarProps> = ({ protein, carbs, fat }) => {
  const totalMacros = protein + carbs + fat;

  if (totalMacros === 0) {
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1"></div>
    );
  }

  const proteinPercent = (protein / totalMacros) * 100;
  const carbsPercent = (carbs / totalMacros) * 100;
  const fatPercent = (fat / totalMacros) * 100;

  return (
    <div className="w-full flex rounded-full h-2 mt-1 overflow-hidden bg-gray-200 dark:bg-gray-700">
      <div
        className="bg-sky-500 transition-all duration-300"
        style={{ width: `${proteinPercent}%` }}
        title={`Protein: ${Math.round(protein)}g`}
      ></div>
      <div
        className="bg-amber-500 transition-all duration-300"
        style={{ width: `${carbsPercent}%` }}
        title={`Carbs: ${Math.round(carbs)}g`}
      ></div>
      <div
        className="bg-rose-500 transition-all duration-300"
        style={{ width: `${fatPercent}%` }}
        title={`Fat: ${Math.round(fat)}g`}
      ></div>
    </div>
  );
};

export default MacroBar;
