import React, { useState } from 'react';
import type { UserProfile, NutritionInfo } from '../types';
import { calculatePersonalizedGoals } from '../services/geminiService';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';

interface ProfileOnboardingProps {
  onComplete: (profile: UserProfile, goals: NutritionInfo) => void;
}

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

const dietPreferences: { type: UserProfile['dietaryPreference'], icon: string, name: string }[] = [
    { type: 'non-vegetarian', icon: 'M15 15L9 9m6 0l-6 6M21 12a9 9 0 11-18 0 9 9 0 0118 0z', name: 'Non-Vegetarian' },
    { type: 'vegetarian', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z', name: 'Vegetarian' },
    { type: 'vegan', icon: 'M16.5 18.75h-9a9.75 9.75 0 100-13.5h9a9.75 9.75 0 100 13.5z', name: 'Vegan' },
];


const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<Partial<UserProfile>>({
        gender: 'male',
        activityLevel: 'Sedentary',
        aspirations: 'Maintain Health',
        dietaryPreference: 'non-vegetarian'
    });
    
    const steps = ['Welcome', 'About You', 'Dietary Preference', 'Activity Level', 'Your Goal', 'Calculating...'];
    const totalSteps = steps.length - 1;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };
    
    const isStep1Valid = () => profileData.age && profileData.weight && profileData.height && profileData.gender;

    const handleNext = () => {
        if (step === 1 && !isStep1Valid()) {
            setError("Please fill out all the fields.");
            return;
        }
        setError(null);
        if (step < totalSteps - 1) {
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
        if (!isStep1Valid()) {
            setError("Please fill in all your details.");
            setStep(1); // Go back to details step
            return;
        }
        
        setStep(totalSteps); // Go to calculating step
        setIsLoading(true);
        setError(null);
        
        try {
            const finalProfile = profileData as UserProfile;
            const goals = await calculatePersonalizedGoals(finalProfile);
            onComplete(finalProfile, goals);
        } catch (e: any) {
            setError(e.message || "Failed to calculate goals. Please try again.");
            setStep(totalSteps - 1); // Go back to previous step
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="text-center flex flex-col justify-center items-center h-full">
                        <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-16 h-16 mx-auto text-teal-500 mb-6"/>
                        <h2 className="text-3xl font-bold mb-3">Welcome to VisionCal</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-sm">Let's set up your profile to personalize your nutrition journey. It'll only take a minute!</p>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Tell us about you</h2>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                <select name="gender" value={profileData.gender} onChange={handleInputChange} className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none appearance-none">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                                    <input type="number" name="age" placeholder="e.g., 30" value={profileData.age || ''} onChange={handleInputChange} className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                                    <input type="number" name="weight" placeholder="e.g., 75" value={profileData.weight || ''} onChange={handleInputChange} className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                                    <input type="number" name="height" placeholder="e.g., 180" value={profileData.height || ''} onChange={handleInputChange} className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-center mb-6">Do you have any dietary preferences?</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {dietPreferences.map(item => (
                                <button key={item.type} type="button" onClick={() => setProfileData(p => ({...p, dietaryPreference: item.type}))} className={`p-4 rounded-xl text-left border-2 flex items-center gap-4 transition-all duration-200 ease-in-out ${profileData.dietaryPreference === item.type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">What's your activity level?</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {activityLevels.map(item => (
                                <button key={item.level} type="button" onClick={() => setProfileData(p => ({...p, activityLevel: item.level}))} className={`p-4 rounded-xl text-left border-2 flex items-center gap-4 transition-all duration-200 ease-in-out ${profileData.activityLevel === item.level ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full">
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
            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6">What is your primary goal?</h2>
                        <div className="grid grid-cols-2 gap-4">
                             {aspirations.map(item => (
                                <button key={item.type} type="button" onClick={() => setProfileData(p => ({...p, aspirations: item.type}))} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center aspect-square transition-all duration-200 ease-in-out ${profileData.aspirations === item.type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-full mb-3">
                                        <Icon path={item.icon} className="w-8 h-8 text-teal-500 dark:text-teal-400"/>
                                    </div>
                                    <p className="font-semibold text-center text-gray-800 dark:text-gray-100">{item.type}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="text-center py-8 flex flex-col justify-center items-center h-full">
                        <Loader text="Personalizing your experience..." />
                        <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xs">Our AI is calculating your optimal daily goals based on your profile.</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg mx-auto relative p-6 md:p-8 flex flex-col space-y-6">
                
                {step < totalSteps && (
                    <div>
                        <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">STEP {step + 1} OF {totalSteps -1}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                            <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" style={{width: `${((step + 1) / (totalSteps-1)) * 100}%`}}></div>
                        </div>
                    </div>
                )}

                <div key={step} className="animate-fade-in min-h-[320px] flex flex-col justify-center">
                    {renderStepContent()}
                </div>

                {error && <p className="text-center text-red-500 text-sm -mt-4">{error}</p>}
                
                {step < totalSteps && (
                    <div className="flex items-center gap-4 pt-2">
                        <button onClick={handleBack} disabled={step === 0} className="w-1/3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Back
                        </button>
                        {step < totalSteps - 1 ? (
                            <button onClick={handleNext} className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                Next
                            </button>
                        ) : (
                            <button onClick={handleSubmit} className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                Finish Setup
                            </button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProfileOnboarding;