import type { Achievement, Meal, NutritionInfo, WaterLog } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Milestone
  {
    id: 'first_log',
    name: 'First Step',
    description: 'Log your very first meal.',
    iconPath: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    category: 'Milestone',
    rarity: 'Common',
  },
  {
    id: 'culinary_explorer_5',
    name: 'Culinary Explorer',
    description: 'Log 5 different kinds of meals.',
    iconPath: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582',
    category: 'Milestone',
    rarity: 'Common',
  },
  // Logging
  {
    id: 'photogenic',
    name: 'Photogenic',
    description: 'Log your first meal using a photo.',
    iconPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z',
    category: 'Logging',
    rarity: 'Common',
  },
  {
    id: 'sharp_shooter_10',
    name: 'Sharp Shooter',
    description: 'Log 10 meals using photo recognition.',
    iconPath: 'M6.828 6.828a4.5 4.5 0 016.364 0l6.364 6.364a4.5 4.5 0 01-6.364 6.364L6.828 13.172a4.5 4.5 0 010-6.364z',
    category: 'Logging',
    rarity: 'Rare',
  },
  {
    id: 'good_listener',
    name: 'Good Listener',
    description: 'Log your first meal using your voice.',
    iconPath: 'M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z',
    category: 'Logging',
    rarity: 'Common',
  },
  {
    id: 'scanner',
    name: 'Scanner',
    description: 'Log your first meal using a barcode.',
    iconPath: 'M3.75 4.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM8.25 15a.75.75 0 01-.75-.75V12a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H8.25z',
    category: 'Logging',
    rarity: 'Common',
  },
  {
    id: 'trifecta',
    name: 'Logging Trifecta',
    description: 'Log meals using photo, voice, and barcode.',
    iconPath: 'M16.5 18.75h-9a9.75 9.75 0 100-13.5h9a9.75 9.75 0 100 13.5z',
    category: 'Logging',
    rarity: 'Epic',
  },
  // Consistency
  {
    id: 'streak_3',
    name: 'Getting Consistent',
    description: 'Log a meal 3 days in a row.',
    iconPath: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z',
    category: 'Consistency',
    rarity: 'Common',
  },
   {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Log a meal 7 days in a row.',
    iconPath: 'M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM10.5 21a10.5 10.5 0 100-21 10.5 10.5 0 000 21z',
    category: 'Consistency',
    rarity: 'Rare',
  },
  {
    id: 'streak_30',
    name: 'Monthly Maintainer',
    description: 'Log a meal 30 days in a row.',
    iconPath: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18',
    category: 'Consistency',
    rarity: 'Epic',
  },
  // Hydration
  {
    id: 'hydration_hero_1',
    name: 'Hydration Hero',
    description: 'Hit your daily water goal for the first time.',
    iconPath: 'M15 15.25a3 3 0 100-6 3 3 0 000 6z M21 12a9 9 0 11-18 0 9 9 0 0118 0z M13.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    category: 'Hydration',
    rarity: 'Common'
  },
  // Nutrition
  {
    id: 'goal_crusher_3',
    name: 'Calorie Conscious',
    description: 'Hit your daily calorie goal 3 times.',
    iconPath: 'M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    category: 'Nutrition',
    rarity: 'Common',
  },
  {
    id: 'protein_powerhouse',
    name: 'Protein Powerhouse',
    description: 'Consume over 100g of protein in a single day.',
    iconPath: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
    category: 'Nutrition',
    rarity: 'Common',
  },
  {
    id: 'iron_clad',
    name: 'Iron Clad',
    description: 'Hit your daily iron goal for the first time.',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    category: 'Nutrition',
    rarity: 'Rare',
  },
  {
    id: 'vitamin_c_victor',
    name: 'Vitamin C Victor',
    description: 'Hit your daily Vitamin C goal for the first time.',
    iconPath: 'M12 1.5a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM18.364 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07zM22.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM19.434 18.364a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.061 0l-.071-.07a.75.75 0 010-1.061l.07-.071a.75.75 0 011.061 0zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.636 19.434a.75.75 0 010-1.06l.071-.07a.75.75 0 011.06 0l.07.071a.75.75 0 010 1.062l-.07.07a.75.75 0 01-1.062 0l-.071-.07zM1.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zM5.636 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07z',
    category: 'Nutrition',
    rarity: 'Rare',
  },
  {
    id: 'macro_master',
    name: 'Macro Master',
    description: 'Hit protein, carb, and fat goals (±10%) on the same day.',
    iconPath: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.321h5.385c.41 0 .622.512.3.786l-4.343 4.024a.563.563 0 00-.166.548l1.58 5.569c.192.678-.533 1.223-1.14 1.223l-4.782-2.32a.563.563 0 00-.528 0l-4.782 2.32c-.607 0-1.332-.545-1.14-1.223l1.58-5.569a.563.563 0 00-.166.548l-4.343-4.024c-.322-.274-.11-.786.3-.786h5.385a.563.563 0 00.475-.321L11.48 3.5z',
    category: 'Nutrition',
    rarity: 'Epic',
  },
];

const getDayFromISO = (iso: string) => iso.split('T')[0];
const getDaysApart = (day1: string, day2: string) => {
    const date1 = new Date(day1);
    const date2 = new Date(day2);
    return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

const isWithinPercentage = (value: number, target: number, percent: number) => {
    if (target === 0) return value === 0;
    const deviation = Math.abs(value - target) / target;
    return deviation <= (percent / 100);
}

export const checkAchievements = (meals: Meal[], dailyGoal: NutritionInfo, unlockedIds: Set<string>): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];

    if (meals.length === 0) return newlyUnlocked;

    // --- Calculate daily totals and other stats ---
    const mealsByDay: Record<string, NutritionInfo> = {};
    const sourcesUsed = new Set<string>();
    
    meals.forEach(meal => {
        const day = getDayFromISO(meal.date);
        sourcesUsed.add(meal.source);
        if (!mealsByDay[day]) {
            mealsByDay[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        for (const key in meal.nutrition) {
            const nutrientKey = key as keyof NutritionInfo;
            if (typeof meal.nutrition[nutrientKey] === 'number') {
                mealsByDay[day][nutrientKey] = (mealsByDay[day][nutrientKey] ?? 0) + (meal.nutrition[nutrientKey] ?? 0);
            }
        }
    });

    // --- General Stats ---
    const photoLogs = meals.filter(m => m.source === 'photo').length;
    const uniqueMealNames = new Set(meals.map(m => m.name.toLowerCase().trim())).size;

    // --- Streak calculation ---
    const uniqueDays = Object.keys(mealsByDay).sort();
    let currentStreak = 1;
    let maxStreak = uniqueDays.length > 0 ? 1 : 0;
    for(let i = 1; i < uniqueDays.length; i++) {
        if(getDaysApart(uniqueDays[i-1], uniqueDays[i]) === 1) {
            currentStreak++;
        } else if (getDaysApart(uniqueDays[i-1], uniqueDays[i]) > 1) {
            currentStreak = 1;
        }
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }
    }

    // --- Daily Goal Hits ---
    let calorieGoalsHit = 0;
    let ironGoalHit = false;
    let vitaminCGoalHit = false;
    let proteinPowerhouseDay = false;
    let macroMasterDay = false;
    let waterGoalHit = false;
    
    Object.values(mealsByDay).forEach(dayTotals => {
        if (isWithinPercentage(dayTotals.calories, dailyGoal.calories, 10)) {
            calorieGoalsHit++;
        }
        if ((dayTotals.iron ?? 0) >= (dailyGoal.iron ?? Infinity)) {
            ironGoalHit = true;
        }
        if ((dayTotals.vitaminC ?? 0) >= (dailyGoal.vitaminC ?? Infinity)) {
            vitaminCGoalHit = true;
        }
        if ((dayTotals.protein ?? 0) >= 100) {
            proteinPowerhouseDay = true;
        }
        if ((dayTotals.water ?? 0) >= (dailyGoal.waterGoal ?? Infinity)) {
            waterGoalHit = true;
        }
        if (
            isWithinPercentage(dayTotals.protein, dailyGoal.protein, 10) &&
            isWithinPercentage(dayTotals.carbs, dailyGoal.carbs, 10) &&
            isWithinPercentage(dayTotals.fat, dailyGoal.fat, 10)
        ) {
            macroMasterDay = true;
        }
    });


    // --- Check all conditions ---
    const conditions: Record<string, boolean> = {
        // Milestone
        'first_log': meals.length >= 1,
        'culinary_explorer_5': uniqueMealNames >= 5,
        // Logging
        'photogenic': sourcesUsed.has('photo'),
        'sharp_shooter_10': photoLogs >= 10,
        'good_listener': sourcesUsed.has('voice'),
        'scanner': sourcesUsed.has('barcode'),
        'trifecta': sourcesUsed.has('photo') && sourcesUsed.has('voice') && sourcesUsed.has('barcode'),
        // Consistency
        'streak_3': maxStreak >= 3,
        'streak_7': maxStreak >= 7,
        'streak_30': maxStreak >= 30,
        // Hydration
        'hydration_hero_1': waterGoalHit,
        // Nutrition
        'goal_crusher_3': calorieGoalsHit >= 3,
        'protein_powerhouse': proteinPowerhouseDay,
        'iron_clad': ironGoalHit,
        'vitamin_c_victor': vitaminCGoalHit,
        'macro_master': macroMasterDay,
    };

    ALL_ACHIEVEMENTS.forEach(achievement => {
        if (!unlockedIds.has(achievement.id) && conditions[achievement.id]) {
            newlyUnlocked.push(achievement);
        }
    });

    return newlyUnlocked;
};