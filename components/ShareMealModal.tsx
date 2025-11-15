import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { useUI } from '../hooks/useUI';
import type { Meal } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';
import Logo from './common/Logo';
import MacroBar from './common/MacroBar';

const ShareMealCard: React.FC<{ meal: Meal, isDark: boolean }> = ({ meal, isDark }) => {
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
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Logo className="w-7 h-7" style={{ color: '#14b8a6' }} />
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>VisionCal</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280' }}>{meal.mealType}</span>
            </div>
            
            {meal.imageUrlBefore && (
                <img src={meal.imageUrlBefore} alt={meal.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px' }} />
            )}

            <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, padding: '0 8px' }}>{meal.name}</h3>
            </div>

            <div style={{ padding: '16px', background: isDark ? '#1f2937' : '#fff', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: isDark ? '#d1d5db' : '#4b5563', margin: 0 }}>Total Calories</p>
                <p style={{ fontSize: '48px', fontWeight: '800', color: '#14b8a6', margin: 0, lineHeight: 1.1 }}>{Math.round(meal.nutrition.calories)}</p>
            </div>
            
            <div>
                <MacroBar protein={meal.nutrition.protein} carbs={meal.nutrition.carbs} fat={meal.nutrition.fat} />
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', fontSize: '12px', fontWeight: '500' }}>
                    <span style={{ color: '#38bdf8' }}>P: {Math.round(meal.nutrition.protein)}g</span>
                    <span style={{ color: '#f59e0b' }}>C: {Math.round(meal.nutrition.carbs)}g</span>
                    <span style={{ color: '#f43f5e' }}>F: {Math.round(meal.nutrition.fat)}g</span>
                </div>
            </div>
        </div>
    );
};

const ShareMealModal: React.FC = () => {
    const { mealToShare, setMealToShare, setActiveModal } = useUI();
    const onClose = () => {
        setActiveModal(null);
        setMealToShare(null);
    };

    const cardRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    useEffect(() => {
        if (!mealToShare) return;
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
        setTimeout(generateImage, 300);
    }, [mealToShare, isSystemDark]);
    
    const handleShare = useCallback(async () => {
        if (!imageUrl || !mealToShare) return;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'visioncal-meal.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My VisionCal Meal',
                    text: `Check out this meal I logged on VisionCal: ${mealToShare.name}!`,
                    files: [file],
                });
            } else {
                throw new Error("Web Share API not supported for files.");
            }
        } catch (e) {
            console.warn("Web Share failed, falling back to download:", e);
            handleDownload();
        }
    }, [imageUrl, mealToShare]);
    
    const handleDownload = useCallback(() => {
        if (!imageUrl || !mealToShare) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `VisionCal-Meal-${mealToShare.name.replace(/ /g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [imageUrl, mealToShare]);

    if (!mealToShare) return null;

    return (
        <>
            <div ref={cardRef} style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -10 }}>
                <ShareMealCard meal={mealToShare} isDark={isSystemDark} />
            </div>

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
                <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold">Share Meal</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                    </header>
                    <div className="flex-1 overflow-y-auto space-y-4 p-1 pr-2 mt-4 flex flex-col items-center justify-center">
                        {isLoading && <Loader text="Generating your meal card..." />}
                        {error && <p className="text-center text-red-500">{error}</p>}
                        {imageUrl && <img src={imageUrl} alt="Meal summary" className="max-w-full rounded-xl shadow-lg" />}
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

export default ShareMealModal;