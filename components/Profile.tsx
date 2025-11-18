import React, { useState, useEffect, useMemo } from 'react';
import type { NutritionInfo, UserProfile, GoalSuggestion } from '../types';
import { getGoalSuggestions, calculatePersonalizedGoals } from '../services/geminiService';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';
import { nutrientMetadata } from '../services/utils';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const activityLevels: { level: UserProfile['activityLevel'], description: string, icon: string }[] = [
    { level: 'Sedentary', description: 'Little or no exercise', icon: 'M17.25 6.75c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5zM9 4.5a3 3 0 11-6 0 3 3 0 016 0zM12.75 6.75a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zM12 21.75a2.25 2.25 0 01-2.25-2.25v-5.25a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25h-3zM3.75 21.75a2.25 2.25 0 01-2.25-2.25v-5.25a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25h-3z' },
    { level: 'Lightly Active', description: 'Light exercise 1-3 days/week', icon: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' },
    { level: 'Moderately Active', description: 'Moderate exercise 3-5 days/week', icon: 'M11.25 4.5l7.5 7.5-7.5 7.5' },
    { level: 'Very Active', description: 'Hard exercise 6-7 days/week', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' }
];
const aspirations: { type: UserProfile['aspirations'], icon: string }[] = [
    { type: 'Weight Loss', icon: 'M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { type: 'Muscle Gain', icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z' },
    { type: 'Maintain Health', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { type: 'Increase Energy', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
];
const dietaryPreferences: { type: UserProfile['dietaryPreference'], name: string }[] = [
    { type: 'non-vegetarian', name: 'Non-Vegetarian' },
    { type: 'vegetarian', name: 'Vegetarian' },
    { type: 'vegan', name: 'Vegan' },
    { type: 'pescetarian', name: 'Pescetarian' },
    { type: 'paleo', name: 'Paleo' },
    { type: 'keto', name: 'Keto' },
];
const themeOptions: { value: 'light' | 'dark' | 'system', label: string, icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
    { value: 'dark', label: 'Dark', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
    { value: 'system', label: 'System', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z' }
];

type ActiveTab = 'profile' | 'goals' | 'settings';

const TabButton: React.FC<{ label: string; icon: string; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 font-semibold transition-colors duration-200 border-b-2 ${isActive ? 'text-teal-500 border-teal-500' : 'text-gray-500 border-transparent hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
        <Icon path={icon} className="w-6 h-6"/>
        <span className="text-xs">{label}</span>
    </button>
);

const AllNutrientsModal: React.FC<{ isOpen: boolean; onClose: () => void; goals: NutritionInfo; onSave: (newGoals: NutritionInfo) => void; }> = ({ isOpen, onClose, goals, onSave }) => {
    const [localGoals, setLocalGoals] = useState(goals);
    useEffect(() => setLocalGoals(goals), [goals]);
    if (!isOpen) return null;
    const allNutrients = useMemo(() => ['calories', 'protein', 'carbs', 'fat', 'waterGoal', ...Object.keys(nutrientMetadata).filter(k => k !== 'water')], []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalGoals(prev => ({ ...prev, [name]: Number(value) || 0 }));
    };
    const handleSave = () => { onSave(localGoals); onClose(); };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold">All Nutritional Goals</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Icon path="M6 18L18 6M6 6l12 12" /></button>
            </header>
            <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    {allNutrients.map(key => {
                        const metaKey = key === 'waterGoal' ? 'water' : key;
                        const meta = (nutrientMetadata as any)[metaKey] || { label: key.charAt(0).toUpperCase() + key.slice(1), unit: key === 'calories' ? 'kcal' : (key === 'waterGoal' ? 'ml' : 'g')};
                        const nutrientKey = key as keyof NutritionInfo;
                        return (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{meta.label} ({meta.unit})</label>
                                <input type="number" name={key} value={localGoals[nutrientKey] || 0} onChange={handleChange} className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            </div>
                        )
                    })}
                </div>
            </div>
            <footer className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleSave} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">Save All Goals</button>
            </footer>
          </Card>
        </div>
    );
};

const Profile: React.FC = () => {
  const { dailyGoal, setDailyGoal, userProfile, setUserProfile, addWeightEntry, signOut } = useData();
  const { theme, setTheme, setActiveModal, showToast } = useUI();
  const onClose = () => setActiveModal(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [localGoals, setLocalGoals] = useState(dailyGoal);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileHasChanged, setProfileHasChanged] = useState(false);
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(userProfile.weight);
  const [targetWeightUnit, setTargetWeightUnit] = useState<'kg' | 'lbs'>('kg');


  useEffect(() => setLocalProfile(userProfile), [userProfile]);
  useEffect(() => setLocalGoals(dailyGoal), [dailyGoal]);
  useEffect(() => setCurrentWeight(userProfile.weight), [userProfile.weight]);

  const handleProfileChange = <K extends keyof UserProfile>(name: K, value: UserProfile[K]) => {
    const newProfile = { ...localProfile, [name]: value };
    if (name === 'aspirations') {
        if (value === 'Weight Loss' && !newProfile.targetWeight) {
            newProfile.targetWeight = parseFloat((newProfile.weight * 0.9).toFixed(1));
        } else if (value === 'Muscle Gain' && !newProfile.targetWeight) {
            newProfile.targetWeight = parseFloat((newProfile.weight * 1.1).toFixed(1));
        } else if (value !== 'Weight Loss' && value !== 'Muscle Gain') {
            delete newProfile.targetWeight;
        }
    }
    setLocalProfile(newProfile);
    setProfileHasChanged(true);
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalGoals(prev => ({ ...prev, [name]: Number(value) }));
  };
  
  const handleSaveChanges = () => {
    setUserProfile(localProfile);
    setDailyGoal(localGoals);
    onClose();
    showToast("Profile and goals saved!");
  };
  
  const handleGetSuggestions = async (type: 'macros' | 'full') => {
    setIsLoading(true);
    setSuggestions(null);
    try {
        if (type === 'macros') {
            const result = await getGoalSuggestions(localProfile);
            setSuggestions(result);
        } else {
            const result = await calculatePersonalizedGoals(localProfile);
            setLocalGoals(result);
            showToast("AI has recalculated all your goals!");
        }
    } catch (error) {
        console.error("Error getting AI suggestions:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const applySuggestion = (nutrient: GoalSuggestion['nutrient'], value: number) => {
    setLocalGoals(prev => ({ ...prev, [nutrient]: value }));
  };

  const handleAddWeight = () => {
    addWeightEntry(currentWeight);
    handleProfileChange('weight', currentWeight);
    showToast(`Weight for today logged: ${currentWeight} kg`);
  };

  useEffect(() => {
    if (profileHasChanged) {
        setSuggestions(null);
        handleGetSuggestions('macros');
        setProfileHasChanged(false);
    }
  }, [profileHasChanged, localProfile]);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold">Profile & Settings</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Icon path="M6 18L18 6M6 6l12 12" /></button>
        </header>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
           <TabButton label="Profile" icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
           <TabButton label="My Goals" icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m1.5 1.5l-1.5-1.5m1.5 1.5l1.5-1.5M6.75 12h.008v.008H6.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 2.25h.008v.008H6.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" isActive={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
           <TabButton label="Settings" icon="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l.796 1.378a1.125 1.125 0 01-.26 1.431l-1.004.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.004.827c.48.398.668 1.03.26 1.431l-.796 1.378a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-1.094c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-.796-1.378a1.125 1.125 0 01.26-1.431l1.004-.827c.293-.24.438.613-.438.995s-.145-.755-.438-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l.796-1.378a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.076.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="flex-1 overflow-y-auto mt-4 p-1 pr-2 space-y-6">
            {activeTab === 'profile' && (
                <div className="animate-fade-in space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-medium text-gray-500">Age</label>
                            <input type="number" value={localProfile.age} onChange={e => handleProfileChange('age', Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-500">Height (cm)</label>
                            <input type="number" value={localProfile.height} onChange={e => handleProfileChange('height', Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Log Current Weight (kg)</label>
                        <div className="flex gap-2">
                            <input type="number" value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            <button onClick={handleAddWeight} className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">Log</button>
                        </div>
                    </div>
                    {(localProfile.aspirations === 'Weight Loss' || localProfile.aspirations === 'Muscle Gain') && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-medium text-gray-500">Target Weight ({targetWeightUnit})</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={(targetWeightUnit === 'kg' ? localProfile.targetWeight || 0 : (localProfile.targetWeight || 0) * 2.20462).toFixed(1)}
                                    onChange={e => {
                                        const displayValue = Number(e.target.value);
                                        const valueInKg = targetWeightUnit === 'kg' ? displayValue : displayValue / 2.20462;
                                        handleProfileChange('targetWeight', parseFloat(valueInKg.toFixed(1)));
                                    }}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                />
                                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                    <button onClick={() => setTargetWeightUnit('kg')} className={`px-2 text-sm font-semibold rounded ${targetWeightUnit === 'kg' ? 'bg-white dark:bg-gray-800' : ''}`}>kg</button>
                                    <button onClick={() => setTargetWeightUnit('lbs')} className={`px-2 text-sm font-semibold rounded ${targetWeightUnit === 'lbs' ? 'bg-white dark:bg-gray-800' : ''}`}>lbs</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold mb-2">Primary Goal</h4>
                         <div className="grid grid-cols-2 gap-2">
                             {aspirations.map(item => (
                                <button key={item.type} onClick={() => handleProfileChange('aspirations', item.type)} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center gap-2 ${localProfile.aspirations === item.type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <Icon path={item.icon} className={`w-6 h-6 ${localProfile.aspirations === item.type ? 'text-teal-500' : 'text-gray-500'}`}/>
                                    <span className="text-sm font-medium">{item.type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Activity Level</h4>
                         <div className="grid grid-cols-2 gap-2">
                             {activityLevels.map(item => (
                                <button key={item.level} onClick={() => handleProfileChange('activityLevel', item.level)} className={`p-3 rounded-lg border-2 text-left ${localProfile.activityLevel === item.level ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <p className="font-medium text-sm">{item.level}</p>
                                    <p className="text-xs text-gray-500">{item.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'goals' && (
                <div className="animate-fade-in space-y-4">
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-center">
                        <h4 className="font-semibold mb-2 text-teal-800 dark:text-teal-200">AI Goal Suggestions</h4>
                        {isLoading && <Loader text="Getting suggestions..."/>}
                        {suggestions && suggestions.length > 0 && (
                            <div className="space-y-3">
                                {suggestions.map(s => (
                                    <div key={s.nutrient} className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg text-left">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold capitalize">{s.nutrient}: {s.value}g</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{s.reason}</p>
                                            </div>
                                            <button onClick={() => applySuggestion(s.nutrient, s.value)} className="text-xs bg-teal-500 text-white font-bold py-1 px-3 rounded-full hover:bg-teal-600">Apply</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                         <button onClick={() => handleGetSuggestions('full')} disabled={isLoading} className="mt-3 w-full text-sm bg-teal-200/50 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200 font-bold py-2 px-4 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 disabled:opacity-50">
                           {isLoading ? 'Recalculating...' : 'Let AI Recalculate All My Goals'}
                         </button>
                    </div>

                    <h4 className="font-semibold text-lg">Macronutrient Goals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium">Calories</label>
                            <input type="number" name="calories" value={localGoals.calories} onChange={handleGoalChange} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Protein (g)</label>
                            <input type="number" name="protein" value={localGoals.protein} onChange={handleGoalChange} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Carbs (g)</label>
                            <input type="number" name="carbs" value={localGoals.carbs} onChange={handleGoalChange} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Fat (g)</label>
                            <input type="number" name="fat" value={localGoals.fat} onChange={handleGoalChange} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                        </div>
                    </div>
                     <button onClick={() => setIsEditingAll(true)} className="w-full text-sm text-teal-600 dark:text-teal-400 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        Edit All Nutritional Goals
                     </button>
                </div>
            )}
            {activeTab === 'settings' && (
                 <div className="animate-fade-in space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">Appearance</h4>
                        <div className="grid grid-cols-3 gap-2">
                             {themeOptions.map(option => (
                                <button key={option.value} onClick={() => setTheme(option.value)} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center gap-2 ${theme === option.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <Icon path={option.icon} className={`w-6 h-6 ${theme === option.value ? 'text-teal-500' : 'text-gray-500'}`}/>
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Dietary Preference</h4>
                        <select
                            value={localProfile.dietaryPreference}
                            onChange={(e) => handleProfileChange('dietaryPreference', e.target.value as UserProfile['dietaryPreference'])}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none appearance-none"
                        >
                            {dietaryPreferences.map(pref => <option key={pref.type} value={pref.type}>{pref.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => setActiveModal('recipeBox')}
                            className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" className="w-6 h-6 text-teal-500" />
                                <span className="font-semibold">My Recipe Box</span>
                            </div>
                            <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-5 h-5 text-gray-400"/>
                        </button>
                        <button
                            onClick={() => setActiveModal('achievements')}
                            className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Icon path="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385c.41 0 .622.512.3.786l-4.343 4.024a.563.563 0 00-.166.548l1.58 5.569c.192.678-.533 1.223-1.14 1.223l-4.782-2.32a.563.563 0 00-.528 0l-4.782 2.32c-.607 0-1.332-.545-1.14-1.223l1.58-5.569a.563.563 0 00-.166-.548l-4.343-4.024c-.322-.274-.11-.786.3-.786h5.385a.563.563 0 00.475-.321L11.48 3.5z" className="w-6 h-6 text-amber-500" />
                                <span className="font-semibold">View Achievements</span>
                            </div>
                            <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-5 h-5 text-gray-400"/>
                        </button>
                    </div>
                     <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={signOut} className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-red-500/50 text-red-500 bg-red-500/5 dark:bg-red-500/10 rounded-lg hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors font-semibold">
                            <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" className="w-6 h-6"/>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        <footer className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleSaveChanges} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">Save Changes</button>
        </footer>

        <AllNutrientsModal isOpen={isEditingAll} onClose={() => setIsEditingAll(false)} goals={localGoals} onSave={setLocalGoals} />
      </Card>
    </div>
  );
};

export default Profile;