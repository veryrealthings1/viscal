import React, { useEffect } from 'react';
import type { Achievement } from '../../types';
import Icon from './Icon';

interface ToastProps {
  achievement: Achievement;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-fade-in-up"
      onClick={onClose}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 bg-teal-100 dark:bg-teal-900 text-teal-500 rounded-full p-3">
            <Icon path={achievement.iconPath} className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-white">Achievement Unlocked!</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.name}</p>
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

export default Toast;