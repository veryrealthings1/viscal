import React from 'react';
import type { Recipe } from '../types';
import { useUI } from '../hooks/useUI';
import { useData } from '../hooks/useData';
import Card from './common/Card';
import Icon from './common/Icon';

interface RecipeModalProps {
  recipe: Recipe;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe }) => {
  const { setActiveModal, showToast } = useUI();
  const { addRecipe, savedRecipes } = useData();
  const onClose = () => setActiveModal(null);

  const isSaved = savedRecipes.some(r => r.name === recipe.name);

  const handleSave = () => {
    if (!isSaved) {
      addRecipe(recipe);
      showToast("Recipe saved to your box!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold">{recipe.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon path="M6 18L18 6M6 6l12 12" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4">
          <p className="text-gray-600 dark:text-gray-300">{recipe.description}</p>
          <div className="flex gap-4 text-center">
            <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Calories</p>
              <p className="font-bold text-lg">{Math.round(recipe.calories)}</p>
            </div>
            <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Protein</p>
              <p className="font-bold text-lg">{Math.round(recipe.protein)}g</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">Ingredients</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="font-semibold">{ing.amount}</span> {ing.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <footer className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={handleSave} disabled={isSaved} className="flex-1 flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
            <Icon path="M17.593 3.322c-1.192-1.192-3.126-1.192-4.318 0L12 4.596l-1.275-1.274c-1.192-1.192-3.126-1.192-4.318 0a3.036 3.036 0 000 4.318l5.593 5.594a.75.75 0 001.06 0l5.593-5.594a3.036 3.036 0 000-4.318z" className="w-5 h-5"/>
            {isSaved ? 'Saved' : 'Save to Recipe Box'}
          </button>
          <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Close
          </button>
        </footer>
      </Card>
    </div>
  );
};

export default RecipeModal;