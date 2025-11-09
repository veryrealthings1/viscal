import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl shadow-lg dark:shadow-black/20 p-6 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
