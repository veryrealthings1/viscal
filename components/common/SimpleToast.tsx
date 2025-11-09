import React, { useEffect } from 'react';
import Icon from './Icon';

interface SimpleToastProps {
  message: string;
  onClose: () => void;
}

const SimpleToast: React.FC<SimpleToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const iconPath = "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  const iconColor = 'text-teal-500';
  const bgColor = 'bg-teal-100 dark:bg-teal-900';

  return (
    <div 
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-fade-in-up"
      onClick={onClose}
    >
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 ${bgColor} ${iconColor} rounded-full p-2`}>
            <Icon path={iconPath} className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-white">{message}</p>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SimpleToast;