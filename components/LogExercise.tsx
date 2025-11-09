import React, { useState } from 'react';
import type { Exercise } from '../types';
import { analyzeActivityFromText } from '../services/geminiService';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const LogExercise: React.FC = () => {
  const { addExercise, userProfile } = useData();
  const { setActiveModal, showToast } = useUI();
  const onClose = () => setActiveModal(null);

  const [description, setDescription] = useState('');
  const [analysis, setAnalysis] = useState<Omit<Exercise, 'id' | 'date'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Please describe your activity.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeActivityFromText(description, userProfile);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogExercise = () => {
    if (!analysis) return;
    addExercise(analysis);
    showToast('Activity logged successfully!');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon path="M6 18L18 6M6 6l12 12" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Log an Activity</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Describe your workout, and our AI will estimate the calories burned. For example, "Went for a 45 minute run" or "30 mins of yoga".
          </p>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your activity..."
            rows={3}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !description.trim()}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-5 h-5" />
                Analyze with AI
              </>
            )}
          </button>
        </div>

        {error && <p className="my-4 text-center text-red-500">{error}</p>}
        
        {analysis && !isLoading && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <h3 className="font-semibold text-lg text-center">Analysis Results</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activity</p>
                    <p className="text-xl font-bold">{analysis.name}</p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-xl font-bold">{analysis.durationMinutes} <span className="text-base font-normal">min</span></p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Calories Burned</p>
                    <p className="text-xl font-bold text-rose-500">~{Math.round(analysis.caloriesBurned)}</p>
                </div>
            </div>
            <button
              onClick={handleLogExercise}
              className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Log to Diary
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogExercise;