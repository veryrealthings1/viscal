import React, { useState } from 'react';
import Card from './common/Card';
import Icon from './common/Icon';

interface FeatureTourProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
    title: 'Welcome to VisionCal!',
    description: 'Your personal AI-powered nutrition tracker. Let\'s take a quick tour of the key features to get you started on your health journey.',
  },
  {
    icon: 'M12 4.5v15m7.5-7.5h-15',
    title: 'Log Meals Effortlessly',
    description: 'Tap the large "+" button to add a meal. You can snap a photo, speak a description, or scan a barcode. Our AI will handle the rest.',
  },
  {
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Chat with Your AI Nutritionist',
    description: 'Have questions? Tap the chat icon to talk to your AI assistant. Ask for advice, get meal ideas, or even update your goals conversationally.',
  },
  {
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start tracking. Remember, consistency is key. We\'re here to help you every step of the way. Happy tracking!',
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
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto relative text-center flex flex-col items-center p-8">
        <div className="bg-teal-100 dark:bg-teal-900 text-teal-500 rounded-full p-4 mb-6">
          <Icon path={currentStep.icon} className="w-12 h-12" />
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