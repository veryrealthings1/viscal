import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AnalyzedFoodItem, Meal, MealType, Recipe } from '../types';
import { ai, analyzeFoodImage, analyzeFoodFromText } from '../services/geminiService';
import { fileToBase64, encode, calculateTotalNutrition } from '../services/utils';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import BarcodeScanner from './BarcodeScanner';
import { getFoodItemFromBarcode } from '../services/barcodeService';

type LogMode = 'photo' | 'manual' | 'voice' | 'barcode' | 'recipe';
type Step = 'mode' | 'mealType' | 'input' | 'results';

const mealTypes: { type: MealType, icon: string }[] = [
    { type: 'Breakfast', icon: "M12 1.5a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM18.364 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07zM22.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM19.434 18.364a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.061 0l-.071-.07a.75.75 0 010-1.061l.07-.071a.75.75 0 011.061 0zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.636 19.434a.75.75 0 010-1.06l.071-.07a.75.75 0 011.06 0l.07.071a.75.75 0 010 1.062l-.07.07a.75.75 0 01-1.062 0l-.071-.07zM1.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zM5.636 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07z" },
    { type: 'Lunch', icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
    { type: 'Dinner', icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" },
    { type: 'Snack', icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
];
const logModes: { mode: LogMode, name: string, icon: string }[] = [
    { mode: 'photo', name: 'Photo', icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" },
    { mode: 'manual', name: 'Manual', icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" },
    { mode: 'voice', name: 'Voice', icon: "M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" },
    { mode: 'barcode', name: 'Barcode', icon: "M3.75 4.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM8.25 15a.75.75 0 01-.75-.75V12a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H8.25z" },
    { mode: 'recipe', name: 'My Recipes', icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" },
];

const QuantityControl: React.FC<{ quantity: number; setQuantity: (q: number) => void; }> = ({ quantity, setQuantity }) => {
    const updateQuantity = (newQuantity: number) => {
        setQuantity(Math.max(0.1, parseFloat(newQuantity.toFixed(2))));
    };
    return (
        <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Servings:</span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-full">
                <button onClick={() => updateQuantity(quantity - 0.25)} className="px-3 py-1 text-lg font-bold text-teal-600 dark:text-teal-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">-</button>
                <input type="number" value={quantity} onChange={(e) => updateQuantity(parseFloat(e.target.value) || 0)} className="w-12 text-center bg-transparent font-semibold focus:outline-none" step="0.1" min="0.1"/>
                <button onClick={() => updateQuantity(quantity + 0.25)} className="px-3 py-1 text-lg font-bold text-teal-600 dark:text-teal-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">+</button>
            </div>
        </div>
    );
};

const FoodLogger: React.FC = () => {
    const { addMeal, savedRecipes } = useData();
    const { setActiveModal, showToast } = useUI();
    const onClose = () => setActiveModal(null);
    
    const [step, setStep] = useState<Step>('mode');
    const [mode, setMode] = useState<LogMode | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('Lunch');
    const [analysis, setAnalysis] = useState<AnalyzedFoodItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Photo mode state
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Voice mode state
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    // Manual mode state
    const [manualDescription, setManualDescription] = useState('');

    // Barcode mode state
    const [isFetchingBarcodeData, setIsFetchingBarcodeData] = useState(false);
    
    const reset = () => {
        setStep('mode');
        setMode(null);
        setAnalysis(null);
        setIsLoading(false);
        setError(null);
        setImageUrl(null);
        if (isRecording) stopRecording();
        setTranscribedText('');
        setManualDescription('');
        setIsFetchingBarcodeData(false);
    };
    
    const handleModeSelect = (selectedMode: LogMode) => {
        setMode(selectedMode);
        setStep('mealType');
    };

    const handleMealTypeSelect = (type: MealType) => {
        setSelectedMealType(type);
        setStep('input');
    };

    const handleBack = () => {
        setError(null);
        if (step === 'results') setStep('input');
        else if (step === 'input') setStep('mealType');
        else if (step === 'mealType') setStep('mode');
    };

    const handleAddMeal = (items: AnalyzedFoodItem[], source: Meal['source']) => {
        if (!items || items.length === 0) return;
        const totalNutrition = calculateTotalNutrition(items);
        const mealName = items.map(item => `${item.name} (${item.quantity} serving${item.quantity !== 1 ? 's' : ''})`).join(', ');
        const now = new Date();
        addMeal({
            id: now.toISOString(), name: mealName, nutrition: totalNutrition,
            imageUrlBefore: source === 'photo' ? imageUrl ?? undefined : undefined,
            items: items, date: now.toISOString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            source, mealType: selectedMealType
        });
        showToast('Meal added successfully!');
        onClose();
    };

    // --- PHOTO MODE ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUri = e.target?.result as string;
                setImageUrl(dataUri);
                handleAnalyzePhoto(dataUri);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleAnalyzePhoto = async (dataUri: string) => {
        setIsLoading(true); setError(null);
        try {
            const base64Image = dataUri.split(',')[1];
            const result = await analyzeFoodImage(base64Image);
            setAnalysis(result);
            setStep('results');
        } catch (e: any) { setError(e.message); setStep('input'); } 
        finally { setIsLoading(false); }
    };
    
    // --- MANUAL MODE ---
    const handleAnalyzeManual = async () => {
        if (!manualDescription.trim()) return;
        setIsLoading(true); setError(null);
        try {
            const result = await analyzeFoodFromText(manualDescription);
            if (result.length === 0) throw new Error("The AI couldn't identify any food. Please be more specific.");
            setAnalysis(result);
            setStep('results');
        } catch (e: any) { setError(e.message); } 
        finally { setIsLoading(false); }
    };

    // --- VOICE MODE ---
    const stopRecording = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        sessionPromiseRef.current?.then(session => session.close());
        setIsRecording(false);
    }, []);

    useEffect(() => () => { if (isRecording) stopRecording(); }, [isRecording, stopRecording]);

    const handleAnalyzeVoice = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsLoading(true); setError(null);
        try {
            const result = await analyzeFoodFromText(text);
            if (result.length === 0) throw new Error("Sorry, I couldn't understand that. Could you be more specific?");
            setAnalysis(result);
            setStep('results');
        } catch (e: any) { setError(e.message); setStep('input'); } 
        finally { setIsLoading(false); }
    }, []);
    
    const startRecording = useCallback(async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setTranscribedText(''); setIsRecording(true);
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = audioContextRef.current.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
                            sessionPromiseRef.current?.then((s) => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onclose: () => {},
                    onerror: () => { setError('Voice recognition failed.'); stopRecording(); },
                    onmessage: (msg) => msg.serverContent?.inputTranscription && setTranscribedText(prev => prev + msg.serverContent.inputTranscription.text)
                },
                config: { inputAudioTranscription: {} }
            });
        } catch (err) { setError("Could not access microphone."); setIsRecording(false); }
    }, [stopRecording]);

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
            setTimeout(() => handleAnalyzeVoice(transcribedText), 500);
        } else {
            startRecording();
        }
    };

    // --- BARCODE MODE ---
    const handleScanSuccess = useCallback(async (barcode: string) => {
        setIsFetchingBarcodeData(true);
        setError(null);
        try {
            const result = await getFoodItemFromBarcode(barcode);
            if (result.length > 0) {
                setAnalysis(result);
                setStep('results');
            } else {
                setError(`Product not found for barcode: ${barcode}. You can try logging it manually.`);
            }
        } catch (e: any) {
            setError(e.message || "An error occurred while looking up the barcode.");
        } finally {
            setIsFetchingBarcodeData(false);
        }
    }, []);
    
    const handleScanError = useCallback((message: string) => setError(message), []);


    // --- RECIPE MODE ---
    const handleAnalyzeRecipe = async (recipeName: string) => {
        if (!recipeName.trim()) return;
        setIsLoading(true); setError(null);
        try {
            const result = await analyzeFoodFromText(recipeName);
            if (result.length === 0) throw new Error("The AI couldn't get nutrition for this recipe. Please log it manually.");
            setAnalysis(result);
            setStep('results');
        } catch (e: any) { 
            setError(e.message); 
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between pb-3">
                    {step !== 'mode' ? (
                        <button onClick={handleBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full"><Icon path="M15.75 19.5L8.25 12l7.5-7.5" /></button>
                    ) : <div className="w-9 h-9"></div>}
                    <h2 className="text-2xl font-bold text-center">Log Meal</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                </header>

                <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
                <div key={step} className="animate-fade-in space-y-6">

                    {step === 'mode' && (
                        <div className="text-center space-y-6 py-4">
                            <h3 className="text-xl font-semibold">How would you like to log?</h3>
                            <div className="flex flex-wrap justify-center gap-4">
                                {logModes.map(m => (
                                    <button key={m.mode} onClick={() => handleModeSelect(m.mode)} className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/40 flex flex-col items-center justify-center w-32 aspect-square transition-all">
                                        <Icon path={m.icon} className="w-10 h-10 text-teal-500 mb-2"/>
                                        <span className="font-semibold">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'mealType' && (
                        <div className="text-center space-y-6 py-4">
                            <h3 className="text-xl font-semibold">What type of meal is it?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {mealTypes.map(m => (
                                    <button key={m.type} onClick={() => handleMealTypeSelect(m.type)} className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/40 flex flex-col items-center justify-center aspect-square transition-all">
                                        <Icon path={m.icon} className="w-10 h-10 text-teal-500 mb-2"/>
                                        <span className="font-semibold">{m.type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {step === 'input' && (
                        <div className="space-y-4">
                            {isLoading ? <Loader text="Analyzing..." /> : (
                                <>
                                    {mode === 'photo' && (
                                        <>
                                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                            <div onClick={() => fileInputRef.current?.click()} className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <Icon path={logModes.find(m=>m.mode==='photo')?.icon!} className="mx-auto h-12 w-12 text-gray-400"/>
                                                <p className="mt-2 text-lg font-semibold text-gray-600 dark:text-gray-300">Tap to upload a photo</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Our AI will identify the food and estimate its nutrition.</p>
                                            </div>
                                        </>
                                    )}
                                    {mode === 'manual' && (
                                        <form onSubmit={(e) => { e.preventDefault(); handleAnalyzeManual(); }} className="space-y-4">
                                            <p className="text-center text-gray-500 dark:text-gray-400">Describe your meal in detail, including quantities (e.g., "A bowl of oatmeal with blueberries and a coffee").</p>
                                            <textarea value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} placeholder="e.g., 2 eggs, 3 strips of bacon, and a glass of orange juice" rows={4} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                                            <button type="submit" className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600">Analyze Meal</button>
                                        </form>
                                    )}
                                    {mode === 'voice' && (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                            <button onClick={handleToggleRecording} className={`rounded-full p-6 transition-all duration-300 ${isRecording ? 'bg-rose-500 shadow-rose-500/30 shadow-lg' : 'bg-teal-500 shadow-teal-500/30 shadow-lg'}`}>
                                                <div className={isRecording ? 'animate-pulse' : ''}><Icon path={logModes.find(m=>m.mode==='voice')?.icon!} className="w-10 h-10 text-white"/></div>
                                            </button>
                                            <p className="text-gray-500 dark:text-gray-400 h-5 font-semibold">{isRecording ? 'Recording... Tap to finish' : 'Tap to speak'}</p>
                                            <p className="text-gray-800 dark:text-gray-200 min-h-[24px]">{transcribedText}</p>
                                        </div>
                                    )}
                                    {mode === 'barcode' && (isFetchingBarcodeData 
                                        ? <Loader text="Looking up product..." />
                                        : <BarcodeScanner onScanSuccess={handleScanSuccess} onError={handleScanError} />
                                    )}
                                    {mode === 'recipe' && (
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-semibold text-center">Select from your recipes</h3>
                                            {savedRecipes.length > 0 ? (
                                                savedRecipes.map(recipe => (
                                                    <button key={recipe.name} onClick={() => handleAnalyzeRecipe(recipe.name)} className="w-full text-left p-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                        <p className="font-bold">{recipe.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{Math.round(recipe.calories)} kcal &bull; {Math.round(recipe.protein)}g Protein</p>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Icon path="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.185 0 4.236.624 6 1.742m6-16.25a8.967 8.967 0 01-6 2.292m6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.185 0-4.236.624-6 1.742m6-16.25v16.25" className="w-12 h-12 mx-auto mb-2"/>
                                                    <p className="font-semibold">Your Recipe Box is empty.</p>
                                                    <p className="text-sm">Save recipes from AI suggestions to log them here quickly.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                            {error && <p className="text-center text-red-500">{error}</p>}
                        </div>
                    )}

                    {step === 'results' && analysis && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-center">Is this correct?</h3>
                            {imageUrl && <img src={imageUrl} alt="Food" className="rounded-lg w-full max-h-48 object-contain" />}
                            {analysis.map((item, index) => (
                                <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{item.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{Math.round(item.calories * item.quantity)} kcal &bull; P:{Math.round(item.protein * item.quantity)}g C:{Math.round(item.carbs*item.quantity)}g F:{Math.round(item.fat*item.quantity)}g</p>
                                    </div>
                                    {item.antiNutrients?.length && (
                                    <div className="p-2 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-sm rounded-r-md">
                                        <div className="flex items-start gap-2">
                                            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
                                            <div><h5 className="font-semibold">Heads up! Contains:</h5><ul className="list-disc list-inside">{item.antiNutrients.map(an => <li key={an.name}><strong>{an.name}:</strong> {an.description}</li>)}</ul></div>
                                        </div>
                                    </div>
                                    )}
                                    <QuantityControl quantity={item.quantity} setQuantity={(q) => setAnalysis(prev => prev!.map((it, i) => i === index ? { ...it, quantity: q } : it))} />
                                </div>
                            ))}
                            <button onClick={() => { setStep('input'); setMode('manual'); setManualDescription(analysis.map(i => `${i.quantity} ${i.name}`).join(', ')); setAnalysis(null); }} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><Icon path="M12 4.5v15m7.5-7.5h-15" className="w-5 h-5" />Add or correct an item</button>
                            <button onClick={() => handleAddMeal(analysis, mode!)} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600">Add to Diary</button>
                        </div>
                    )}
                </div>
                </div>
                 <style>{`
                    .custom-scrollbar::-webkit-scrollbar { display: none; }
                    .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </Card>
        </div>
    );
};

export default FoodLogger;
