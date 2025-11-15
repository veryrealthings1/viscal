import React, { useState, useRef } from 'react';
import type { Meal } from '../types';
import { analyzeMealConsumption } from '../services/geminiService';
import { calculateTotalNutrition } from '../services/utils';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import MacroBar from './common/MacroBar';

const UpdateMealWithPhoto: React.FC<{ meal: Meal }> = ({ meal }) => {
  const { updateMeal } = useData();
  const { setActiveModal, showToast } = useUI();
  const onClose = () => setActiveModal(null);

  const [afterImageUri, setAfterImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAfterImageUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecalculate = async () => {
    if (!afterImageUri || !meal.imageUrlBefore) return;

    setIsLoading(true);
    setError(null);
    try {
      const base64Before = meal.imageUrlBefore.split(',')[1];
      const base64After = afterImageUri.split(',')[1];

      const newItems = await analyzeMealConsumption(base64Before, base64After);
      
      if (newItems.length === 0) {
        throw new Error("AI could not determine the consumed portion. Please try again with clearer photos.");
      }

      const newTotalNutrition = calculateTotalNutrition(newItems);
      
      const updatedMeal: Meal = {
        ...meal,
        items: newItems,
        nutrition: newTotalNutrition,
        imageUrlAfter: afterImageUri,
        name: meal.name.includes('(Updated)') ? meal.name : `${meal.name} (Updated)`,
      };
      
      updateMeal(meal.id, updatedMeal);
      showToast("Meal consumption recalculated!");
      onClose();

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold">Update Meal Consumption</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon path="M6 18L18 6M6 6l12 12" />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-center mb-2">Before Eating</h4>
                    <img src={meal.imageUrlBefore} alt="Meal before eating" className="w-full h-48 object-cover rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
                <div>
                    <h4 className="font-semibold text-center mb-2">After Eating</h4>
                    {afterImageUri ? (
                        <img src={afterImageUri} alt="Leftovers" className="w-full h-48 object-cover rounded-lg bg-gray-100 dark:bg-gray-800" />
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <Icon path="M6.828 6.828a4.5 4.5 0 016.364 0l6.364 6.364a4.5 4.5 0 01-6.364 6.364L6.828 13.172a4.5 4.5 0 010-6.364z" className="h-10 w-10 text-gray-400"/>
                            <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Add Leftovers Photo</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="pt-4 space-y-2">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    Add a photo of your leftovers. The AI will compare it to the original photo to accurately calculate your meal's nutrition.
                </p>
                {isLoading && <Loader text="Analyzing consumption..." />}
                {error && <p className="text-center text-red-500">{error}</p>}
            </div>

            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold">Original Logged Nutrition</h4>
                <p className="text-lg font-bold">{Math.round(meal.nutrition.calories)} kcal</p>
                <MacroBar protein={meal.nutrition.protein} carbs={meal.nutrition.carbs} fat={meal.nutrition.fat} />
            </div>
        </div>

        <footer className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
                onClick={handleRecalculate} 
                disabled={!afterImageUri || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400"
            >
                {isLoading ? 'Recalculating...' : 'Recalculate & Update Meal'}
            </button>
        </footer>
      </Card>
    </div>
  );
};

export default UpdateMealWithPhoto;