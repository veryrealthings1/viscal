import React, { useState } from 'react';
import Card from './common/Card';
import Icon from './common/Icon';
import Logo from './common/Logo';

interface FeatureTourProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: 'logo',
    title: 'Welcome to VisionCal!',
    description: "Your personal AI-powered nutrition tracker. Let's take a quick tour of the key features to get you started on your health journey.",
  },
  {
    icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
    title: 'Dashboard At a Glance',
    description: 'Your main screen shows your daily progress. Track your calories, protein, carbs, and fat with the large progress rings. Aim to stay within your goals!',
  },
  {
    icon: 'M12 4.5v15m7.5-7.5h-15',
    title: 'Effortless Logging',
    description: 'Tap the large "+" button to add a meal. You can snap a photo, speak a description, type it manually, or scan a barcode. Our AI will handle the rest.',
  },
  {
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Your AI Team',
    description: 'Have questions? Tap the chat icon to talk to your AI Nutritionist, or use the Live Coach for a real-time voice conversation to get advice or log food on the go.',
  },
  {
    icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.517l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
    title: 'Track Your Progress',
    description: 'Use the "Diary" and "Trends" tabs at the bottom to review your meal history, see your calorie intake over time, and monitor your consistency.',
  },
  {
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    title: "You're All Set!",
    description: "You're ready to start tracking. Remember, consistency is key. We're here to help you every step of the way. Happy tracking!",
  },
];

const FeatureTour: React.FC<FeatureTourProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const currentStep = onboardingSteps[step];

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto relative text-center flex flex-col items-center p-8">
        <div className="bg-teal-100 dark:bg-teal-900 text-teal-500 rounded-full p-4 mb-6">
          {currentStep.icon === 'logo' ? <Logo className="w-12 h-12" /> : <Icon path={currentStep.icon} className="w-12 h-12" />}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">{currentStep.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 h-24">{currentStep.description}</p>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === step ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center gap-4">
          {step > 0 ? (
            <button 
              onClick={handleBack}
              className="w-1/3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="w-1/3 bg-transparent text-gray-500 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          )}

          <button 
            onClick={handleNext}
            className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors"
          >
            {step === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default FeatureTour;