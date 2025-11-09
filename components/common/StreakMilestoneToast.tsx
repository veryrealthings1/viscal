import React, { useEffect, useState, useMemo } from 'react';
import Icon from './Icon';

interface StreakMilestoneToastProps {
  milestone: number;
  onClose: () => void;
}

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-2 h-4" style={style}></div>
);

const StreakMilestoneToast: React.FC<StreakMilestoneToastProps> = ({ milestone, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setShow(true), 100);

        // Animate out and close
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 500); // Wait for fade-out animation
        }, 4500);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(timer);
        }
    }, [onClose]);
    
    // Generate random confetti pieces
    const confetti = useMemo(() => Array.from({ length: 50 }).map((_, i) => {
        const colors = ['#2dd4bf', '#a78bfa', '#facc15', '#fb923c', '#f472b6'];
        const style: React.CSSProperties = {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * -50}%`, // Start above screen
            backgroundColor: colors[i % colors.length],
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `fall ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
        };
        return <ConfettiPiece key={i} style={style} />;
    }), []);

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="absolute inset-0 overflow-hidden">
                {confetti}
            </div>
            <div className={`relative text-center p-8 transition-all duration-500 ease-out ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                {/* Fix: Moved the style prop from the Icon component to its parent div wrapper. */}
                <div className="relative inline-block" style={{ filter: 'drop-shadow(0 0 20px #f97316)'}}>
                     <Icon path="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z" 
                        className="w-24 h-24 text-orange-400" 
                     />
                </div>
                <h2 className="text-6xl font-black text-white mt-4" style={{ WebkitTextStroke: '2px #f97316', textShadow: '0 0 15px #f97316' }}>
                    {milestone} DAY STREAK!
                </h2>
                <p className="text-2xl font-bold text-white mt-2">You're on fire!</p>
            </div>
            <style>{`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default StreakMilestoneToast;
