import React, { useMemo } from 'react';
import { ALL_ACHIEVEMENTS } from '../services/achievements';
import type { Achievement } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';

interface AchievementsProps {
  unlockedIds: Set<string>;
  onClose: () => void;
}

const rarityStyles: Record<Achievement['rarity'], { border: string, text: string, shadow: string }> = {
    Common: { border: 'border-transparent', text: 'text-gray-400 dark:text-gray-500', shadow: '' },
    Rare: { border: 'border-sky-500/50', text: 'text-sky-500', shadow: 'shadow-sky-500/20' },
    Epic: { border: 'border-purple-500/50', text: 'text-purple-500', shadow: 'shadow-purple-500/20' },
};

const AchievementItem: React.FC<{ achievement: Achievement, isUnlocked: boolean }> = ({ achievement, isUnlocked }) => {
    const styles = rarityStyles[achievement.rarity];

    return (
    <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${isUnlocked ? `bg-teal-500/5 dark:bg-teal-900/30 ${styles.border} shadow-lg ${styles.shadow}` : 'bg-gray-100 dark:bg-gray-800/60 border-transparent'}`}>
        <div className={`p-3 rounded-full ${isUnlocked ? `bg-teal-500/10 ${styles.text.replace('gray-400', 'teal-500')}` : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
            <Icon path={achievement.iconPath} className="w-8 h-8"/>
        </div>
        <div className={`flex-1 ${!isUnlocked && 'opacity-60'}`}>
            <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-800 dark:text-white">{achievement.name}</h3>
                <span className={`text-xs font-bold uppercase ${styles.text}`}>{achievement.rarity}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
        </div>
    </div>
    )
};


const Achievements: React.FC<AchievementsProps> = ({ unlockedIds, onClose }) => {
  const unlockedCount = unlockedIds.size;
  const totalCount = ALL_ACHIEVEMENTS.length;
  
  const achievementsByCategory = useMemo(() => {
    return ALL_ACHIEVEMENTS.reduce((acc, achievement) => {
      const category = achievement.category;
      (acc[category] = acc[category] || []).push(achievement);
      return acc;
    }, {} as Record<Achievement['category'], Achievement[]>);
  }, []);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10">
          <Icon path="M6 18L18 6M6 6l12 12" />
        </button>
        <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Your Achievements</h2>
            <p className="text-gray-500 dark:text-gray-400">You've unlocked {unlockedCount} of {totalCount} achievements.</p>
        </div>
        <div className="overflow-y-auto space-y-6 p-1 pr-2">
          {Object.entries(achievementsByCategory).map(([category, achievements]) => (
            <div key={category}>
                <h3 className="font-semibold text-lg text-teal-600 dark:text-teal-400 mb-2 px-2">{category}</h3>
                <div className="space-y-3">
                    {/* FIX: Cast `achievements` to `Achievement[]` to resolve sort method error. */}
                    {(achievements as Achievement[]).sort((a,b) => (unlockedIds.has(a.id) ? -1 : 1) - (unlockedIds.has(b.id) ? -1 : 1)).map(ach => (
                        <AchievementItem key={ach.id} achievement={ach} isUnlocked={unlockedIds.has(ach.id)} />
                    ))}
                </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Achievements;
