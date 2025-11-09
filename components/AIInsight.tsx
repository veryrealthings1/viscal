import React from 'react';
import Card from './common/Card';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';

const AIInsight: React.FC = () => {
    const { dailyInsight } = useData();

    if (!dailyInsight) {
        return null; // Don't render if no insight is available
    }
    
    const iconMap: Record<string, string> = {
        trophy: 'M16.5 18.75h-9a9.75 9.75 0 100-13.5h9a9.75 9.75 0 100 13.5z',
        star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385c.41 0 .622.512.3.786l-4.343 4.024a.563.563 0 00-.166.548l1.58 5.569c.192.678-.533 1.223-1.14 1.223l-4.782-2.32a.563.563 0 00-.528 0l-4.782 2.32c-.607 0-1.332-.545-1.14-1.223l1.58-5.569a.563.563 0 00-.166-.548l-4.343-4.024c-.322-.274-.11-.786.3-.786h5.385a.563.563 0 00.475-.321L11.48 3.5z',
        heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
        seedling: 'M13.293 9.293a1.5 1.5 0 00-2.122 0l-1.5 1.5a1.5 1.5 0 102.122 2.122L13.293 9.293zM15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
        chart: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m1.5 1.5l-1.5-1.5m1.5 1.5l1.5-1.5',
        target: 'M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        lightbulb: 'M10.5 14.25h3M12 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm9 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    };

    return (
        <Card className="animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Icon path={iconMap[dailyInsight.icon] || iconMap.star} className="w-6 h-6 text-indigo-500 dark:text-indigo-300"/>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{dailyInsight.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dailyInsight.summary}</p>
                </div>
            </div>
        </Card>
    );
};

export default AIInsight;