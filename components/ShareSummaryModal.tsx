import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { useUI } from '../hooks/useUI';
// FIX: Changed to a type-only import for DailySummary and Meal.
import type { DailySummary, Meal } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';
import Logo from './common/Logo';
import MacroBar from './common/MacroBar';

const ShareCard: React.FC<{ summary: DailySummary, isDark: boolean }> = ({ summary, isDark }) => {
    const { totals, date, meals } = summary;
    const mealTypes: Meal['mealType'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const groupedMeals = mealTypes.map(type => ({
        type,
        meals: meals.filter(m => m.mealType === type)
    })).filter(g => g.meals.length > 0);

    return (
        <div 
            style={{ 
                width: 400,
                fontFamily: "'Inter', sans-serif",
                background: isDark ? '#111827' : '#f9fafb',
                color: isDark ? '#f3f4f6' : '#1f2937',
                padding: '24px',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                borderRadius: '24px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Logo className="w-7 h-7" style={{ color: '#14b8a6' }} />
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>VisionCal</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div style={{ padding: '16px', background: isDark ? '#1f2937' : '#fff', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#4b5563', margin: 0 }}>Total Calories</p>
                <p style={{ fontSize: '48px', fontWeight: '800', color: '#14b8a6', margin: 0, lineHeight: 1.1 }}>{Math.round(totals.calories)}</p>
            </div>
            
            <div style={{ marginTop: '16px' }}>
                <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', fontSize: '12px', fontWeight: '500' }}>
                    <span style={{ color: '#38bdf8' }}>P: {Math.round(totals.protein)}g</span>
                    <span style={{ color: '#f59e0b' }}>C: {Math.round(totals.carbs)}g</span>
                    <span style={{ color: '#f43f5e' }}>F: {Math.round(totals.fat)}g</span>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                {groupedMeals.map(group => (
                    <div key={group.type} style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#14b8a6' }}>{group.type}</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '13px', color: isDark ? '#d1d5db' : '#4b5563' }}>
                            {group.meals.map(meal => <li key={meal.id}>- {meal.name}</li>)}
                        </ul>
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, zIndex: -1 }}>
                <Logo className="w-48 h-48" style={{ color: isDark ? '#fff' : '#000' }} />
            </div>
        </div>
    );
};

const ShareSummaryModal: React.FC<{ summary: DailySummary }> = ({ summary }) => {
    const { setActiveModal } = useUI();
    const onClose = () => setActiveModal(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    useEffect(() => {
        const generateImage = async () => {
            if (cardRef.current) {
                try {
                    const dataUrl = await htmlToImage.toPng(cardRef.current, { 
                        pixelRatio: 2, 
                        backgroundColor: isSystemDark ? '#111827' : '#f9fafb' 
                    });
                    setImageUrl(dataUrl);
                } catch (e) {
                    console.error("Failed to generate image", e);
                    setError("Could not generate the shareable image. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        // Timeout to allow fonts and styles to render
        setTimeout(generateImage, 300);
    }, [summary, isSystemDark]);

    const handleShare = useCallback(async () => {
        if (!imageUrl) return;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'visioncal-summary.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My VisionCal Summary',
                    text: `Here's my nutrition summary for ${new Date(summary.date).toLocaleDateString()} from VisionCal!`,
                    files: [file],
                });
            } else {
                throw new Error("Web Share API not supported for files.");
            }
        } catch (e) {
            console.warn("Web Share failed, falling back to download:", e);
            handleDownload(); // Fallback to download if sharing fails
        }
    }, [imageUrl, summary.date]);
    
    const handleDownload = useCallback(() => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `VisionCal-Summary-${summary.date}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [imageUrl, summary.date]);

    return (
        <>
            <div ref={cardRef} style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10 }}>
                <ShareCard summary={summary} isDark={isSystemDark} />
            </div>

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
                <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold">Share Your Summary</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                    </header>
                    <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4 flex flex-col items-center justify-center">
                        {isLoading && <Loader text="Generating your summary card..." />}
                        {error && <p className="text-center text-red-500">{error}</p>}
                        {imageUrl && <img src={imageUrl} alt="Daily nutrition summary" className="max-w-full rounded-xl shadow-lg" />}
                    </div>
                    <footer className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-3">
                       {navigator.share && (
                         <button onClick={handleShare} disabled={isLoading || !!error} className="flex-1 flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400">
                            <Icon path="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.04.39.068.588.068h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216zM13.873 17.562a2.25 2.25 0 100-2.186m0 2.186c-.195-.04-.39-.068-.588-.068h-3.91a2.25 2.25 0 00-2.04 1.284 2.25 2.25 0 002.04 3.216h3.91a2.25 2.25 0 002.04-1.284 2.25 2.25 0 00-2.04-3.216z" className="w-5 h-5"/>
                            Share
                        </button>
                       )}
                        <button onClick={handleDownload} disabled={isLoading || !!error} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400">
                            <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-5 h-5"/>
                            Download
                        </button>
                    </footer>
                </Card>
            </div>
        </>
    );
};

export default ShareSummaryModal;