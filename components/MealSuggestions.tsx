import React, { useState, useEffect, useMemo } from 'react';
import type { Meal, NutritionInfo, MealSuggestion, UserProfile } from '../types';
import { getMealSuggestions, generateRecipe, generateImageForMeal } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

interface MealSuggestionWithImage extends MealSuggestion {
    imageUrl?: string;
}

const MealTypeIcon: React.FC<{ mealType: MealSuggestion['mealType'] }> = ({ mealType }) => {
    const iconMap: Record<MealSuggestion['mealType'], string> = {
        Breakfast: "M12 1.5a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM18.364 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07zM22.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM19.434 18.364a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.061 0l-.071-.07a.75.75 0 010-1.061l.07-.071a.75.75 0 011.061 0zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.636 19.434a.75.75 0 010-1.06l.071-.07a.75.75 0 011.06 0l.07.071a.75.75 0 010 1.062l-.07.07a.75.75 0 01-1.062 0l-.071-.07zM1.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zM5.636 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07z",
        Lunch: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
        Dinner: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
        Snack: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    };
    return <Icon path={iconMap[mealType] || iconMap.Snack} className="w-5 h-5" />;
};


const MealSuggestions: React.FC = () => {
    const { todaysNutrition, dailyGoal, meals, userProfile } = useData();
    const { setRecipe, setActiveModal } = useUI();
    const [suggestions, setSuggestions] = useState<MealSuggestionWithImage[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingRecipe, setIsGeneratingRecipe] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const remainingNutrients = useMemo(() => {
        const remaining: Partial<NutritionInfo> = {};
        for (const key in dailyGoal) {
            const nutrientKey = key as keyof NutritionInfo;
            const goal = dailyGoal[nutrientKey] ?? 0;
            const consumed = todaysNutrition[nutrientKey] ?? 0;
            if (goal > 0) {
                 remaining[nutrientKey] = Math.max(0, goal - consumed);
            }
        }
        return remaining;
    }, [dailyGoal, todaysNutrition]);
    
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            setError(null);
            
            if (remainingNutrients.calories! < dailyGoal.calories * 0.1) {
                setSuggestions([]);
                setIsLoading(false);
                return;
            }

            try {
                const pastMealNames: string[] = Array.from(new Set(meals.slice(-20).map(m => m.name)));
                const baseSuggestions = await getMealSuggestions(remainingNutrients, pastMealNames, userProfile);
                
                // Set text-only suggestions first for a faster UI response
                setSuggestions(baseSuggestions);

                // Then, generate images sequentially to avoid rate limiting
                const suggestionsWithImages: MealSuggestionWithImage[] = [...baseSuggestions];
                for (let i = 0; i < baseSuggestions.length; i++) {
                    try {
                        const imageUrl = await generateImageForMeal(baseSuggestions[i].name);
                        suggestionsWithImages[i] = { ...suggestionsWithImages[i], imageUrl };
                        // Update the state progressively so images appear as they load
                        setSuggestions([...suggestionsWithImages]);
                    } catch (e) {
                        console.error(`Failed to generate image for ${baseSuggestions[i].name}`, e);
                        // The suggestion will just lack an image, which is a graceful fallback.
                    }
                }
            } catch (e: any) {
                setError(e.message || "Could not fetch suggestions.");
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(timer);

    }, [remainingNutrients, dailyGoal.calories, meals, userProfile]);

    const handleGenerateRecipe = async (suggestion: MealSuggestion) => {
        setIsGeneratingRecipe(suggestion.name);
        try {
            const recipe = await generateRecipe(suggestion.name, remainingNutrients.calories || 500, userProfile.dietaryPreference);
            setRecipe(recipe);
            setActiveModal('recipe');
        } catch (e) {
            console.error("Failed to generate recipe", e);
            setError("Sorry, couldn't create a recipe right now.");
        } finally {
            setIsGeneratingRecipe(null);
        }
    };


    if (isLoading) {
        return (
            <Card>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">AI Meal Ideas</h2>
                <Loader text="Generating personalized suggestions..." />
            </Card>
        );
    }
    
    if (error) {
         return (
            <Card>
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">AI Meal Ideas</h2>
                <p className="text-center text-red-500 py-4">{error}</p>
            </Card>
        );
    }
    
    if (!suggestions || suggestions.length === 0) {
         return (
            <Card>
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">AI Meal Ideas</h2>
                <div className="text-center py-4">
                    <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 mx-auto text-emerald-500 mb-2"/>
                    <p className="text-gray-600 dark:text-gray-300 font-semibold">Great job today!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">You're on track with your nutrition goals.</p>
                </div>
            </Card>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 px-4 md:px-0 text-gray-900 dark:text-white">AI Meal Ideas</h2>
            <div className="flex overflow-x-auto space-x-4 pb-4 px-4 md:px-0 -mx-4 md:mx-0 custom-scrollbar">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex-shrink-0 w-72 snap-start">
                        <Card className="h-full flex flex-col p-5">
                             <div className="flex-1">
                                {suggestion.imageUrl ? (
                                    <div className="relative w-full h-36 -mt-5 -mx-5 mb-4 rounded-t-3xl overflow-hidden group">
                                        <img src={suggestion.imageUrl} alt={suggestion.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 text-white">
                                            <div className="flex items-center gap-2">
                                                <MealTypeIcon mealType={suggestion.mealType} />
                                                <p className="text-sm font-bold uppercase tracking-wider">{suggestion.mealType}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-2 text-teal-600 dark:text-teal-400">
                                        <MealTypeIcon mealType={suggestion.mealType} />
                                        <p className="text-sm font-bold uppercase tracking-wider">{suggestion.mealType}</p>
                                    </div>
                                )}
                                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">{suggestion.name}</h3>
                                {!suggestion.imageUrl && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                                )}
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
                                <span className="text-xs font-semibold bg-gray-200/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded-full self-start">{suggestion.nutritionSummary}</span>
                                <button
                                    onClick={() => handleGenerateRecipe(suggestion)}
                                    disabled={!!isGeneratingRecipe}
                                    className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400"
                                >
                                    {isGeneratingRecipe === suggestion.name ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-5 h-5"/>
                                            <span>Generate Recipe</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4b5563; }
                .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
            `}</style>
        </div>
    );
};

export default MealSuggestions;