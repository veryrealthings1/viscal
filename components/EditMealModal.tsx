import React, { useState, useEffect } from 'react';
import type { Meal, AnalyzedFoodItem, MealType, NutritionInfo } from '../types';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import Card from './common/Card';
import Icon from './common/Icon';
import { calculateTotalNutrition } from '../services/utils';

const EditMealModal: React.FC<{ meal: Meal }> = ({ meal }) => {
  const { updateMeal } = useData();
  const { setActiveModal, showToast } = useUI();
  const [localMeal, setLocalMeal] = useState<Meal>(meal);

  useEffect(() => {
    setLocalMeal(meal);
  }, [meal]);

  const handleItemChange = (index: number, field: keyof AnalyzedFoodItem, value: string | number) => {
    const newItems = [...localMeal.items];
    const itemToUpdate = { ...newItems[index], [field]: value };
    newItems[index] = itemToUpdate;
    setLocalMeal(prev => ({ ...prev, items: newItems }));
  };

  const handleSaveChanges = () => {
    // Recalculate total nutrition before saving
    const totalNutrition = calculateTotalNutrition(localMeal.items);

    updateMeal(localMeal.id, { ...localMeal, nutrition: totalNutrition });
    showToast("Meal updated successfully!");
    setActiveModal(null);
  };
  
  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold">Edit Meal</h3>
            <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon path="M6 18L18 6M6 6l12 12" />
            </button>
        </header>
        <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meal Name</label>
                <input
                    type="text"
                    value={localMeal.name}
                    onChange={e => setLocalMeal(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meal Type</label>
                <select 
                    value={localMeal.mealType} 
                    onChange={e => setLocalMeal(prev => ({...prev, mealType: e.target.value as MealType}))}
                    className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                    {mealTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>

            <h4 className="font-semibold pt-2">Items</h4>
            {localMeal.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="col-span-2">
                            <label className="text-xs font-medium">Name</label>
                            <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                         <div>
                            <label className="text-xs font-medium">Servings</label>
                            <input type="number" value={item.quantity} step="0.1" onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Calories</label>
                            <input type="number" value={item.calories} onChange={e => handleItemChange(index, 'calories', Number(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Protein (g)</label>
                            <input type="number" value={item.protein} onChange={e => handleItemChange(index, 'protein', Number(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Carbs (g)</label>
                            <input type="number" value={item.carbs} onChange={e => handleItemChange(index, 'carbs', Number(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Fat (g)</label>
                            <input type="number" value={item.fat} onChange={e => handleItemChange(index, 'fat', Number(e.target.value))} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm" />
                        </div>
                    </div>
                    {item.antiNutrients && item.antiNutrients.length > 0 && (
                        <div className="p-2 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-sm rounded-r-md">
                            <div className="flex items-start gap-2">
                                <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
                                <div>
                                    <h5 className="font-semibold">Contains:</h5>
                                    <ul className="list-disc list-inside">
                                        {item.antiNutrients.map(an => (
                                            <li key={an.name}><strong>{an.name}:</strong> {an.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

        </div>
        <footer className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleSaveChanges} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                Save Changes
            </button>
        </footer>
      </Card>
    </div>
  );
};

export default EditMealModal;