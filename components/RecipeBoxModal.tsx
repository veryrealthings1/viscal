import React, { useState } from 'react';
import type { Recipe } from '../types';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import Card from './common/Card';
import Icon from './common/Icon';

const RecipeBoxItem: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
    const { setRecipe, setActiveModal } = useUI();
    const { deleteRecipe } = useData();

    const handleView = () => {
        setRecipe(recipe);
        setActiveModal('recipe');
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the recipe "${recipe.name}"?`)) {
            deleteRecipe(recipe.name);
        }
    };

    return (
        <Card className="p-0 flex items-center overflow-hidden group/recipe">
            <div className="flex-1 p-4 cursor-pointer" onClick={handleView}>
                <h4 className="font-bold">{recipe.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(recipe.calories)} kcal &bull; {Math.round(recipe.protein)}g Protein
                </p>
            </div>
            <button onClick={handleDelete} className="p-4 bg-red-500 text-white translate-x-full group-hover/recipe:translate-x-0 transition-transform h-full flex items-center">
                <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-6 h-6"/>
            </button>
        </Card>
    );
};


const RecipeBoxModal: React.FC = () => {
    const { savedRecipes } = useData();
    const { setActiveModal } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const onClose = () => setActiveModal(null);

    const filteredRecipes = savedRecipes.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-10 -m-6 mb-0 p-6">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <Icon path="M6 18L18 6M6 6l12 12" />
                    </button>
                    <h2 className="text-2xl font-bold text-center">My Recipe Box</h2>
                    <div className="relative mt-4">
                        <Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-900 border border-transparent rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(recipe => <RecipeBoxItem key={recipe.name} recipe={recipe} />)
                    ) : (
                        <div className="text-center py-16">
                            <Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="font-semibold text-lg">Your Recipe Box is Empty</h3>
                            <p className="text-gray-500">
                                {searchTerm ? `No recipes match "${searchTerm}".` : "Save recipes from AI suggestions to find them here."}
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecipeBoxModal;