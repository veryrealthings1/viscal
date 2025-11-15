import React, { useState, useMemo } from 'react';
import type { Meal, MealType } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import MacroBar from './common/MacroBar';

const MealItem: React.FC<{ meal: Meal }> = React.memo(({ meal }) => {
  const { deleteMeal } = useData();
  const { setMealToEdit, setActiveModal, setMealToUpdateWithPhoto, setMealToShare } = useUI();
  const { name, nutrition, imageUrlBefore, time, source } = meal;
  
  const sourceIcons: Record<Meal['source'], string> = {
    photo: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z",
    manual: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
    voice: "M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z",
    barcode: "M3.75 4.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM8.25 15a.75.75 0 01-.75-.75V12a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H8.25z",
    recipe: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25",
  };

  const handleEdit = () => {
    setMealToEdit(meal);
    setActiveModal('editMeal');
  };
  
  const handleUpdateWithPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMealToUpdateWithPhoto(meal);
    setActiveModal('updateMealPhoto');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${meal.name}"?`)) {
      deleteMeal(meal.id);
    }
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMealToShare(meal);
    setActiveModal('shareMeal');
  };

  const canUpdateWithPhoto = meal.source === 'photo' && meal.imageUrlBefore && !meal.imageUrlAfter;

  return (
    <Card className="p-0 flex items-stretch overflow-hidden group/meal">
      <div className="flex-1 p-4 cursor-pointer flex gap-4 items-center" onClick={handleEdit}>
          {imageUrlBefore && <img src={imageUrlBefore} alt={name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
          <div className="flex-1">
              <p className="font-bold">{name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(nutrition.calories)} kcal &bull; P:{Math.round(nutrition.protein)}g C:{Math.round(nutrition.carbs)}g F:{Math.round(nutrition.fat)}g
              </p>
          </div>
          <div className="text-right">
              <p className="text-sm font-semibold">{time}</p>
              <Icon path={sourceIcons[source]} className="w-5 h-5 text-gray-400 mt-1 ml-auto" />
          </div>
      </div>
       <button onClick={handleShare} title="Share this meal" className="p-4 bg-teal-500 text-white opacity-0 group-hover/meal:opacity-100 transition-opacity h-full flex items-center">
         <Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.04.39.068.588.068h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216zM13.873 17.562a2.25 2.25 0 100-2.186m0 2.186c-.195-.04-.39-.068-.588-.068h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216z" className="w-6 h-6"/>
       </button>
       {canUpdateWithPhoto && (
        <button onClick={handleUpdateWithPhoto} title="Update with leftovers photo" className="p-4 bg-sky-500 text-white opacity-0 group-hover/meal:opacity-100 transition-opacity h-full flex items-center">
            <Icon path="M6.828 6.828a4.5 4.5 0 016.364 0l6.364 6.364a4.5 4.5 0 01-6.364 6.364L6.828 13.172a4.5 4.5 0 010-6.364z" className="w-6 h-6"/>
        </button>
       )}
      <button onClick={handleDelete} className="p-4 bg-red-500 text-white opacity-0 group-hover/meal:opacity-100 transition-opacity h-full flex items-center">
        <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-6 h-6"/>
      </button>
    </Card>
  );
});

const Diary: React.FC = () => {
  const { meals } = useData();
  const { setActiveModal, setSummaryToShare } = useUI();
  const onClose = () => setActiveModal(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMeals = useMemo(() => {
    return meals.filter(meal => 
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.mealType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meals, searchTerm]);
  
  const groupedMealsByDay = useMemo(() => {
    const groups = new Map<string, Meal[]>();
    filteredMeals.forEach(meal => {
      const date = new Date(meal.date).toDateString();
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(meal);
    });
    return Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredMeals]);

  const dailyTotals = useMemo(() => {
    const totals = new Map<string, {calories: number, protein: number, carbs: number, fat: number}>();
    meals.forEach(meal => {
        const date = new Date(meal.date).toDateString();
        const existing = totals.get(date) || {calories: 0, protein: 0, carbs: 0, fat: 0};
        existing.calories += meal.nutrition.calories;
        existing.protein += meal.nutrition.protein;
        existing.carbs += meal.nutrition.carbs;
        existing.fat += meal.nutrition.fat;
        totals.set(date, existing);
    });
    return totals;
  }, [meals]);

  const groupMealsByType = (dayMeals: Meal[]) => {
    const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const grouped = new Map<MealType, Meal[]>();
    dayMeals.forEach(meal => {
      if (!grouped.has(meal.mealType)) grouped.set(meal.mealType, []);
      grouped.get(meal.mealType)!.push(meal);
    });
    return Array.from(grouped.entries()).sort((a,b) => mealOrder.indexOf(a[0]) - mealOrder.indexOf(b[0]));
  };
  
  const handleShareDay = (date: string, dayMeals: Meal[]) => {
    const totals = dailyTotals.get(date)!;
    setSummaryToShare({ date, meals: dayMeals, totals });
    setActiveModal('shareSummary');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-10 -m-6 mb-0 p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon path="M6 18L18 6M6 6l12 12" />
            </button>
            <h2 className="text-2xl font-bold text-center">Meal Diary</h2>
            <div className="relative mt-4">
                <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-900 border border-transparent rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto mt-4 space-y-6">
          {groupedMealsByDay.length > 0 ? (
            groupedMealsByDay.map(([date, dayMeals]) => {
                const totals = dailyTotals.get(date)!;
                return (
                    <div key={date}>
                        <div className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-lg">{date}</h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-500">{Math.round(totals.calories)} kcal</p>
                                  <button onClick={() => handleShareDay(date, dayMeals)} title="Share this day's summary" className="p-1 text-gray-400 hover:text-teal-500">
                                    <Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.04.39.068.588.068h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216zM13.873 17.562a2.25 2.25 0 100-2.186m0 2.186c-.195-.04-.39-.068-.588-.068h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216z" className="w-5 h-5"/>
                                  </button>
                                </div>
                            </div>
                            <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
                        </div>
                        <div className="space-y-3">
                            {groupMealsByType(dayMeals).map(([type, mealsOfType]) => (
                                <div key={type}>
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-1 ml-1">{type}</h4>
                                    {mealsOfType.sort((a, b) => a.time.localeCompare(b.time)).map(meal => <MealItem key={meal.id} meal={meal} />)}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })
          ) : (
            <div className="text-center py-16">
              <Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="font-semibold text-lg">No Meals Found</h3>
              <p className="text-gray-500">
                {searchTerm ? `No meals match "${searchTerm}".` : "Your logged meals will appear here."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Diary;