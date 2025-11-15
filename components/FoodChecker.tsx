import React, { useState, useRef } from 'react';
import type { NutritionInfo, AnalyzedFoodItem, UserProfile, AnalyzedProduct } from '../types';
import { analyzeProductImage } from '../services/geminiService';
import { fileToBase64, limitNutrients } from '../services/utils';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import RingProgress from './common/RingProgress';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const FoodChecker: React.FC = () => {
  const { dailyGoal, todaysNutrition, userProfile } = useData();
  const { setActiveModal } = useUI();
  const onClose = () => setActiveModal(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
      setIsLoading(true);
      try {
        const base64Image = await fileToBase64(file);
        const result = await analyzeProductImage(base64Image, userProfile, dailyGoal);
        setAnalysis(result);
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleReset = () => {
    setImageUrl(null);
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const renderAnalysis = () => {
    if (!analysis) return null;

    const keyNutrients = analysis.nutrients.filter((n: any) => 
        ['Calories', 'Protein', 'Carbs', 'Fat', 'Sodium', 'Sugar'].includes(n.name)
    );
    const scoreColor = analysis.score > 75 ? 'text-emerald-500' : analysis.score > 50 ? 'text-amber-500' : 'text-red-500';
    const userGenderWarning = analysis.genderWarnings?.find(w => w.gender === userProfile.gender);

    return (
      <div className="space-y-6 animate-fade-in">
         <div className="text-center">
            <img src={imageUrl!} alt={analysis.name} className="rounded-lg w-full max-h-56 object-contain mb-4" />
            <h3 className="text-2xl font-bold">{analysis.name}</h3>
         </div>
         
         <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Health Score</p>
                <p className={`text-5xl font-extrabold ${scoreColor}`}>{analysis.score}</p>
            </div>
             <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-left">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Highlights</p>
                <ul className="space-y-1">
                    {analysis.highlights.map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-medium">
                            <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className={`w-4 h-4 mt-0.5 flex-shrink-0 ${h.toLowerCase().includes('high') || h.toLowerCase().includes('excessive') ? 'text-red-500' : 'text-emerald-500'}`}/>
                            <span>{h}</span>
                        </li>
                    ))}
                </ul>
            </div>
         </div>

         <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <h4 className="font-semibold text-gray-900 dark:text-white">AI Verdict</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{analysis.verdict}</p>
         </div>

        {analysis.antiNutrients && analysis.antiNutrients.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                <div className="flex items-start gap-3">
                    <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-6 h-6 flex-shrink-0 text-amber-500 mt-1" />
                    <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">Contains Anti-Nutrients</h4>
                        <ul className="mt-1 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                            {analysis.antiNutrients.map((an) => (
                                <li key={an.name}><strong>{an.name}:</strong> {an.description}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        )}

        {userGenderWarning && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                <div className="flex items-start gap-3">
                    <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-6 h-6 flex-shrink-0 text-amber-500 mt-1" />
                    <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">For Your Consideration</h4>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{userGenderWarning.warning}</p>
                    </div>
                </div>
            </div>
        )}
        
        <div>
            <h4 className="font-semibold text-lg mb-3">Impact on Your Day</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {keyNutrients.map((nutrient: any) => {
                    const nutrientKey = nutrient.name.charAt(0).toLowerCase() + nutrient.name.slice(1);
                    const goal = (dailyGoal as any)[nutrientKey] ?? 0;
                    const current = (todaysNutrition as any)[nutrientKey] ?? 0;
                    const mealAmount = nutrient.value;
                    const projected = current + mealAmount;
                    const isLimit = limitNutrients.has(nutrientKey);
                    
                    const progress = goal > 0 ? (projected / goal) * 100 : 0;
                    
                    let color = 'bg-sky-500';
                    if (isLimit) {
                       if (progress > 100) color = 'bg-red-500';
                       else if (progress > 80) color = 'bg-amber-500';
                       else color = 'bg-emerald-500';
                    } else {
                       if (progress >= 100) color = 'bg-emerald-500';
                    }

                    return (
                        <div key={nutrient.name} className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                             <RingProgress
                                value={projected}
                                goal={goal}
                                label={nutrient.name}
                                unit={nutrient.unit}
                                size={90}
                                strokeWidth={8}
                                color={color}
                            />
                        </div>
                    );
                })}
            </div>
        </div>

         <button onClick={handleReset} className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors">Check Another Item</button>

      </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
          <Icon path="M6 18L18 6M6 6l12 12" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Should I Eat This?</h2>
        
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {!analysis && (
          <div className="mt-4">
            {!imageUrl && !isLoading && (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="mx-auto h-12 w-12 text-gray-400"/>
                <p className="mt-2 font-semibold text-gray-600 dark:text-gray-300">Check a Meal's Impact</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tap to upload a photo</p>
              </div>
            )}
             {imageUrl && <div className="my-4"><img src={imageUrl} alt="Food Product" className="rounded-lg w-full max-h-64 object-contain" /></div>}
             {isLoading && <div className="my-4"><Loader text="Analyzing meal..." /></div>}
          </div>
        )}
       
        {error && 
            <div className="text-center my-4 space-y-3">
                <p className="text-red-500">{error}</p>
                <button onClick={handleReset} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Try Again</button>
            </div>
        }

        {renderAnalysis()}
      </Card>
    </div>
  );
};

export default FoodChecker;