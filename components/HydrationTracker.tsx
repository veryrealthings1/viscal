import React from 'react';
import Card from './common/Card';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';

const HydrationTracker: React.FC = () => {
    const { todaysWaterIntake, dailyGoal, addWaterLog } = useData();
    const waterGoal = dailyGoal.waterGoal ?? 3000;
    const progress = waterGoal > 0 ? (todaysWaterIntake / waterGoal) * 100 : 0;
    const progressWidth = Math.min(progress, 100);

    const waterLevelColor = progress >= 100 ? 'bg-sky-400' : 'bg-sky-500';

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hydration</h2>
                <span className="font-semibold text-sky-600 dark:text-sky-300">{Math.round(todaysWaterIntake)} / {waterGoal} ml</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                <div 
                    className={`h-full rounded-full ${waterLevelColor} transition-all duration-500 ease-out`}
                    style={{ width: `${progressWidth}%` }}
                ></div>
                 <div className="absolute inset-0 water-animation"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => addWaterLog(250)} className="flex items-center justify-center gap-2 p-3 bg-sky-100/70 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-semibold rounded-xl hover:bg-sky-200/70 dark:hover:bg-sky-800/60 transition-colors">
                    <Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 21.496 20.496 22 19.875 22H4.125A1.125 1.125 0 013 20.875v-7.75z" className="w-5 h-5"/>
                    <span>Glass (250ml)</span>
                </button>
                 <button onClick={() => addWaterLog(500)} className="flex items-center justify-center gap-2 p-3 bg-sky-100/70 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-semibold rounded-xl hover:bg-sky-200/70 dark:hover:bg-sky-800/60 transition-colors">
                    <Icon path="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V11.25c0-1.036.84-1.875 1.875-1.875h13.5c1.036 0 1.875.84 1.875 1.875v6.375a1.125 1.125 0 01-1.125 1.125H12.75" className="w-5 h-5"/>
                    <span>Bottle (500ml)</span>
                </button>
            </div>

            <style>{`
                .water-animation {
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                    animation: shimmer 2s infinite linear;
                    background-size: 200% 100%;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </Card>
    );
};

export default HydrationTracker;