
import React from 'react';

const Loader: React.FC<{ text?: string }> = ({ text = "Analyzing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
};

export default Loader;
