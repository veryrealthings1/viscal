import React, { useState, useEffect } from 'react';
import type { UserProfile, NutritionInfo } from '../types';
import { calculatePersonalizedGoals } from '../services/geminiService';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';
import Logo from './common/Logo';

interface ProfileOnboardingProps {
  onComplete: (profile: UserProfile, goals: NutritionInfo) => void;
}

const activityLevels: { level: UserProfile['activityLevel'], description: string, icon: string }[] = [
    { level: 'Sedentary', description: 'Little or no exercise', icon: 'M17.25 6.75c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5zM9 4.5a3 3 0 11-6 0 3 3 0 016 0zM12.75 6.75a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75zM12 21.75a2.25 2.25 0 01-2.25-2.25v-5.25a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25h-3zM3.75 21.75a2.25 2.25 0 01-2.25-2.25v-5.25a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25h-3z' },
    { level: 'Lightly Active', description: 'Exercise 1-3 days/week', icon: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3' },
    { level: 'Moderately Active', description: 'Exercise 3-5 days/week', icon: 'M11.25 4.5l7.5 7.5-7.5 7.5' },
    { level: 'Very Active', description: 'Hard exercise 6-7 days/week', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' }
];

const aspirations: { type: UserProfile['aspirations'], icon: string }[] = [
    { type: 'Weight Loss', icon: 'M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { type: 'Muscle Gain', icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z' },
    { type: 'Maintain Health', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { type: 'Increase Energy', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
];

const dietPreferences: { type: UserProfile['dietaryPreference'], name: string }[] = [
    { type: 'non-vegetarian', name: 'No Preference' },
    { type: 'vegetarian', name: 'Vegetarian' },
    { type: 'vegan', name: 'Vegan' },
    { type: 'pescetarian', name: 'Pescetarian' },
    { type: 'paleo', name: 'Paleo' },
    { type: 'keto', name: 'Keto' },
];

const UnitToggle: React.FC<{ options: {value: string, label: string}[], selected: string, onSelect: (value: string) => void }> = ({ options, selected, onSelect }) => (
    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-full p-1">
        {options.map(opt => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selected === opt.value ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<Partial<UserProfile>>({
        gender: 'male',
        activityLevel: 'Sedentary',
        aspirations: 'Maintain Health',
        dietaryPreference: 'non-vegetarian',
        age: 30,
        weight: 70,
        height: 175,
    });
    
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
    const [targetWeightUnit, setTargetWeightUnit] = useState<'kg' | 'lbs'>('kg');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [editingField, setEditingField] = useState<'age' | 'weight' | 'height' | null>(null);
    const [feet, setFeet] = useState(0);
    const [inches, setInches] = useState(0);

    const steps = ['Welcome', 'About You', 'Your Measurements', 'Dietary Preference', 'Activity Level', 'Your Goal', 'Calculating...'];
    const totalInputSteps = steps.length - 2;
    
    const [visibleTasks, setVisibleTasks] = useState<number[]>([]);
    const calculationTasks = [
        'Calibrating calorie targets',
        'Balancing macronutrients',
        'Tailoring vitamin & mineral goals',
        'Personalizing your plan'
    ];

    useEffect(() => {
        if (step === 6) { // 'Calculating...' step
            // FIX: Changed NodeJS.Timeout to number, as setTimeout in a browser environment returns a number, not a NodeJS.Timeout object.
            const timers: number[] = [];
            calculationTasks.forEach((_, index) => {
                timers.push(setTimeout(() => {
                    setVisibleTasks(prev => [...prev, index]);
                }, index * 700)); // Stagger the animation
            });
            return () => timers.forEach(clearTimeout);
        } else {
            setVisibleTasks([]); // Reset when leaving the step
        }
    }, [step]);


    const handleUpdateProfile = <K extends keyof UserProfile>(name: K, value: UserProfile[K]) => {
        const newProfile = { ...profileData, [name]: value };
        if (name === 'aspirations') {
            if (value === 'Weight Loss') {
                newProfile.targetWeight = parseFloat(((newProfile.weight || 70) * 0.9).toFixed(1));
            } else if (value === 'Muscle Gain') {
                newProfile.targetWeight = parseFloat(((newProfile.weight || 70) * 1.1).toFixed(1));
            } else {
                delete newProfile.targetWeight;
            }
        }
        setProfileData(newProfile);
    };
    
    const isStep1Valid = () => profileData.age && profileData.gender;
    const isStep2Valid = () => profileData.weight && profileData.height;

    const handleNext = () => {
        if (step === 1 && !isStep1Valid()) {
            setError("Please fill out all the fields.");
            return;
        }
        if (step === 2 && !isStep2Valid()) {
            setError("Please fill out all the fields.");
            return;
        }
        setError(null);
        if (step < totalInputSteps) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setError(null);
        if (step > 0) {
            setStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!isStep1Valid() || !isStep2Valid()) {
            setError("Please make sure all your details are filled in correctly.");
            setStep(1); // Go back to first details step
            return;
        }
        
        setStep(totalInputSteps + 1); // Go to calculating step
        setIsLoading(true);
        setError(null);
        
        try {
            const finalProfile = profileData as UserProfile;
            const goals = await calculatePersonalizedGoals(finalProfile);
            onComplete(finalProfile, goals);
        } catch (e: any) {
            setError(e.message || "Failed to calculate goals. Please try again.");
            setStep(totalInputSteps); // Go back to previous step
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditHeight = () => {
        if (heightUnit === 'ft') {
            const heightInCm = profileData.height || 175;
            const totalInches = heightInCm / 2.54;
            setFeet(Math.floor(totalInches / 12));
            setInches(Math.round(totalInches % 12));
        }
        setEditingField('height');
    };

    const handleHeightFtInChange = (newFeet: number, newInches: number) => {
        newFeet = Math.max(0, newFeet);
        newInches = Math.max(0, Math.min(11, newInches));
        setFeet(newFeet);
        setInches(newInches);
        const totalInches = (newFeet * 12) + newInches;
        const cm = totalInches * 2.54;
        handleUpdateProfile('height', Math.round(cm));
    };

    const handleHeightBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setEditingField(null);
        }
    };

    const ProgressBar: React.FC = () => (
        <div className="flex gap-1.5 w-full">
            {Array.from({length: totalInputSteps + 1}).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${step >= i ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            ))}
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="text-center flex flex-col justify-center items-center h-full">
                        <Logo className="w-16 h-16 mx-auto text-teal-500 mb-6"/>
                        <h2 className="text-3xl font-bold mb-3">Welcome to VisionCal</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-sm">Let's create your personalized nutrition plan. It'll only take a minute!</p>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Tell us about yourself</h2>
                        <div className="space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {(['male', 'female', 'other'] as const).map(g => (
                                        <button key={g} onClick={() => handleUpdateProfile('gender', g)} className={`p-3 rounded-xl border-2 capitalize font-semibold ${profileData.gender === g ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Age: {editingField === 'age' ? (
                                        <input
                                            type="number"
                                            value={profileData.age}
                                            onChange={e => handleUpdateProfile('age', Number(e.target.value))}
                                            onBlur={() => setEditingField(null)}
                                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                                            autoFocus
                                            className="w-16 text-center bg-transparent font-bold text-teal-500 border-b-2 border-teal-500 focus:outline-none"
                                        />
                                    ) : (
                                        <span
                                            className="font-bold text-teal-500 cursor-pointer"
                                            onClick={() => setEditingField('age')}
                                        >
                                            {profileData.age}
                                        </span>
                                    )}
                                </label>
                                <input type="range" min="13" max="99" value={profileData.age} onChange={e => handleUpdateProfile('age', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:bg-teal-500"/>
                            </div>
                        </div>
                    </div>
                );
            case 2: {
                const weightInKg = profileData.weight || 70;
                const displayWeight = weightUnit === 'kg' ? weightInKg : weightInKg * 2.20462;
                const weightProps = weightUnit === 'kg' 
                    ? { min: 30, max: 200, step: 0.5 } 
                    : { min: 66, max: 440, step: 1 };

                const heightInCm = profileData.height || 175;
                const displayHeightLabel = () => {
                    if (heightUnit === 'cm') {
                        return `${heightInCm} cm`;
                    } else {
                        const totalInches = heightInCm / 2.54;
                        const feetVal = Math.floor(totalInches / 12);
                        const inchesVal = Math.round(totalInches % 12);
                        return `${feetVal}' ${inchesVal}"`;
                    }
                };
                
                const heightSliderValue = heightUnit === 'cm' ? heightInCm : heightInCm / 2.54;
                const heightProps = heightUnit === 'cm'
                    ? { min: 120, max: 220, step: 1 }
                    : { min: 48, max: 86, step: 1 }; // Approx 4ft to 7'2" in inches
                
                const handleWeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(e.target.value);
                    const valInKg = weightUnit === 'kg' ? val : val / 2.20462;
                    handleUpdateProfile('weight', parseFloat(valInKg.toFixed(1)));
                };

                const handleHeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(e.target.value);
                    const valInCm = heightUnit === 'cm' ? val : val * 2.54;
                    handleUpdateProfile('height', Math.round(valInCm));
                };

                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Your Measurements</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Weight: 
                                        {editingField === 'weight' ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={displayWeight.toFixed(1)}
                                                onChange={handleWeightSliderChange}
                                                onBlur={() => setEditingField(null)}
                                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                                                autoFocus
                                                className="w-20 text-center bg-transparent font-bold text-teal-500 border-b-2 border-teal-500 focus:outline-none"
                                            />
                                        ) : (
                                            <span
                                                className="font-bold text-teal-500 cursor-pointer"
                                                onClick={() => setEditingField('weight')}
                                            >
                                                {displayWeight.toFixed(1)}
                                            </span>
                                        )}
                                        <span className="font-bold text-teal-500 ml-1">{weightUnit}</span>
                                    </label>
                                    <UnitToggle 
                                        options={[{value: 'kg', label: 'kg'}, {value: 'lbs', label: 'lbs'}]} 
                                        selected={weightUnit} 
                                        onSelect={(u) => setWeightUnit(u as 'kg' | 'lbs')} 
                                    />
                                </div>
                                <input 
                                    type="range" 
                                    min={weightProps.min}
                                    max={weightProps.max}
                                    step={weightProps.step}
                                    value={displayWeight}
                                    onChange={handleWeightSliderChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:bg-teal-500"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Height: 
                                        {editingField === 'height' ? (
                                            heightUnit === 'cm' ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        value={heightInCm}
                                                        onChange={e => handleUpdateProfile('height', Number(e.target.value))}
                                                        onBlur={() => setEditingField(null)}
                                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                                                        autoFocus
                                                        className="w-20 text-center bg-transparent font-bold text-teal-500 border-b-2 border-teal-500 focus:outline-none"
                                                    />
                                                    <span className="font-bold text-teal-500 ml-1">cm</span>
                                                </>
                                            ) : (
                                                <div className="inline-block" onBlur={handleHeightBlur}>
                                                    <input
                                                        type="number"
                                                        value={feet}
                                                        onChange={e => handleHeightFtInChange(Number(e.target.value), inches)}
                                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                                                        autoFocus
                                                        className="w-12 text-center bg-transparent font-bold text-teal-500 border-b-2 border-teal-500 focus:outline-none"
                                                    />
                                                    <span className="font-bold text-teal-500">' </span>
                                                    <input
                                                        type="number"
                                                        value={inches}
                                                        onChange={e => handleHeightFtInChange(feet, Number(e.target.value))}
                                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
                                                        className="w-12 text-center bg-transparent font-bold text-teal-500 border-b-2 border-teal-500 focus:outline-none"
                                                    />
                                                    <span className="font-bold text-teal-500">"</span>
                                                </div>
                                            )
                                        ) : (
                                            <span
                                                className="font-bold text-teal-500 cursor-pointer"
                                                onClick={handleEditHeight}
                                            >
                                                {displayHeightLabel()}
                                            </span>
                                        )}
                                    </label>
                                    <UnitToggle 
                                        options={[{value: 'cm', label: 'cm'}, {value: 'ft', label: 'ft'}]} 
                                        selected={heightUnit} 
                                        onSelect={(u) => setHeightUnit(u as 'cm' | 'ft')}
                                    />
                                </div>
                                <input 
                                    type="range" 
                                    min={heightProps.min}
                                    max={heightProps.max}
                                    step={heightProps.step}
                                    value={heightSliderValue}
                                    onChange={handleHeightSliderChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:bg-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                );
            }
            case 3:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Do you have any dietary preferences?</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {dietPreferences.map(item => (
                                <button key={item.type} type="button" onClick={() => handleUpdateProfile('dietaryPreference', item.type)} className={`p-4 rounded-xl text-left border-2 flex items-center gap-4 transition-all duration-200 ease-in-out ${profileData.dietaryPreference === item.type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">How active are you?</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {activityLevels.map(item => (
                                <button key={item.level} type="button" onClick={() => handleUpdateProfile('activityLevel', item.level)} className={`p-4 rounded-xl text-left border-2 flex items-start gap-4 transition-all duration-200 ease-in-out ${profileData.activityLevel === item.level ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full mt-1">
                                        <Icon path={item.icon} className="w-6 h-6 text-teal-500 dark:text-teal-400 flex-shrink-0"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{item.level}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5: {
                const showTargetWeight = profileData.aspirations === 'Weight Loss' || profileData.aspirations === 'Muscle Gain';
                const targetWeightInKg = profileData.targetWeight || (profileData.weight || 70);
                const displayTargetWeight = targetWeightUnit === 'kg' ? targetWeightInKg : targetWeightInKg * 2.20462;
                const targetWeightProps = targetWeightUnit === 'kg'
                    ? { min: 30, max: 200, step: 0.5 }
                    : { min: 66, max: 440, step: 1 };
                const handleTargetWeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(e.target.value);
                    const valInKg = targetWeightUnit === 'kg' ? val : val / 2.20462;
                    handleUpdateProfile('targetWeight', parseFloat(valInKg.toFixed(1)));
                };

                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">What is your primary goal?</h2>
                        <div className="grid grid-cols-2 gap-4">
                             {aspirations.map(item => (
                                <button key={item.type} type="button" onClick={() => handleUpdateProfile('aspirations', item.type)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center aspect-square transition-all duration-200 ease-in-out ${profileData.aspirations === item.type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full mb-3">
                                        <Icon path={item.icon} className="w-8 h-8 text-teal-500 dark:text-teal-400"/>
                                    </div>
                                    <p className="font-semibold text-center text-gray-800 dark:text-gray-100">{item.type}</p>
                                </button>
                            ))}
                        </div>
                        {showTargetWeight && (
                            <div className="mt-6 animate-fade-in">
                                <h3 className="text-xl font-bold text-center mb-4">What's your target weight?</h3>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Target: <span className="font-bold text-teal-500">{displayTargetWeight.toFixed(1)}</span>
                                            <span className="font-bold text-teal-500 ml-1">{targetWeightUnit}</span>
                                        </label>
                                        <UnitToggle
                                            options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
                                            selected={targetWeightUnit}
                                            onSelect={(u) => setTargetWeightUnit(u as 'kg' | 'lbs')}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min={targetWeightProps.min}
                                        max={targetWeightProps.max}
                                        step={targetWeightProps.step}
                                        value={displayTargetWeight}
                                        onChange={handleTargetWeightSliderChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:bg-teal-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 6:
                return (
                    <div className="text-center py-8 flex flex-col justify-center items-center h-full">
                        <Loader text="Personalizing your experience..." />
                        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xs">Our AI is calculating your optimal daily goals based on your profile.</p>
                        <ul className="text-sm text-gray-500 dark:text-gray-400 mt-4 space-y-2 text-left w-64">
                            {calculationTasks.map((task, index) => (
                                <li key={index} className={`flex items-center gap-2 transition-all duration-500 ${visibleTasks.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${visibleTasks.includes(index) ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                        {visibleTasks.includes(index) && <Icon path="M4.5 12.75l6 6 9-13.5" className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <span>{task}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg mx-auto relative p-6 md:p-8 flex flex-col space-y-6">
                
                {step > 0 && step <= totalInputSteps && <ProgressBar />}

                <div key={step} className="animate-fade-in min-h-[400px] flex flex-col justify-center">
                    {renderStepContent()}
                </div>

                {error && <p className="text-center text-red-500 text-sm -mt-4">{error}</p>}
                
                {step <= totalInputSteps && (
                    <div className="flex items-center gap-4 pt-2">
                        <button onClick={handleBack} disabled={step === 0} className="w-1/3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Back
                        </button>
                        {step < totalInputSteps ? (
                            <button onClick={handleNext} className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                Next
                            </button>
                        ) : (
                            <button onClick={handleSubmit} className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                Finish & Calculate
                            </button>
                        )}
                    </div>
                )}
                 <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        cursor: pointer;
                        margin-top: -7px; /* Centers thumb on the track */
                    }
                     input[type="range"]::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border: 0;
                        border-radius: 50%;
                        cursor: pointer;
                    }
                `}</style>
            </Card>
        </div>
    );
};

export default ProfileOnboarding;
