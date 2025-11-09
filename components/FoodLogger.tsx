import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AnalyzedFoodItem, Meal, NutritionInfo, MealType } from '../types';
import { ai, analyzeFoodImage, analyzeFoodFromText } from '../services/geminiService';
import { getFoodItemFromBarcode } from '../services/barcodeService';
import { fileToBase64, encode, initialNutrition } from '../services/utils';
import Card from './common/Card';
import Loader from './common/Loader';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

interface LoggableFoodItem extends AnalyzedFoodItem {
  quantity: number;
}

const calculateTotalNutrition = (items: LoggableFoodItem[]): NutritionInfo => {
    return items.reduce((acc, item) => {
        const { quantity } = item;
        for (const key in initialNutrition) {
            const nutrientKey = key as keyof NutritionInfo;
            if (typeof item[nutrientKey] === 'number') {
                acc[nutrientKey] = (acc[nutrientKey] ?? 0) + (item[nutrientKey]! * quantity);
            }
        }
        return acc;
    }, { ...initialNutrition });
};

const mealTypes: { type: MealType, icon: string }[] = [
    { type: 'Breakfast', icon: "M12 1.5a.75.75 0 01.75.75V3a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM18.364 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07zM22.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM19.434 18.364a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.061 0l-.071-.07a.75.75 0 010-1.061l.07-.071a.75.75 0 011.061 0zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.636 19.434a.75.75 0 010-1.06l.071-.07a.75.75 0 011.06 0l.07.071a.75.75 0 010 1.062l-.07.07a.75.75 0 01-1.062 0l-.071-.07zM1.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zM5.636 5.636a.75.75 0 011.06 0l.071.071a.75.75 0 010 1.06l-.07.071a.75.75 0 01-1.062 0l-.071-.07a.75.75 0 010-1.062l.071-.07z" },
    { type: 'Lunch', icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
    { type: 'Dinner', icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" },
    { type: 'Snack', icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
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
                <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => updateQuantity(parseFloat(e.target.value) || 0)}
                    className="w-12 text-center bg-transparent font-semibold focus:outline-none"
                    step="0.1"
                    min="0.1"
                />
                <button onClick={() => updateQuantity(quantity + 0.25)} className="px-3 py-1 text-lg font-bold text-teal-600 dark:text-teal-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">+</button>
            </div>
        </div>
    );
};

const FoodLogger: React.FC = () => {
  const { addMeal } = useData();
  const { setActiveModal, showToast } = useUI();
  const onClose = () => setActiveModal(null);

  const [mode, setMode] = useState<'photo' | 'barcode' | 'voice' | 'manual'>('photo');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Lunch');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<LoggableFoodItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [scannedItem, setScannedItem] = useState<LoggableFoodItem | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceAnalysis, setVoiceAnalysis] = useState<LoggableFoodItem[] | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const [manualItems, setManualItems] = useState([{ id: Date.now(), name: '', quantity: '' }]);
  const [manualAnalysis, setManualAnalysis] = useState<LoggableFoodItem[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeVoice = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
        const result = await analyzeFoodFromText(text);
        setVoiceAnalysis(result.map(item => ({ ...item, quantity: 1 })));
    } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    setIsRecording(false);
    
    setTimeout(() => {
        setTranscribedText(currentText => {
            if (currentText.trim()) {
                handleAnalyzeVoice(currentText);
            }
            return currentText;
        });
    }, 500);
  }, [handleAnalyzeVoice]);
  
  useEffect(() => {
    return () => {
        if (isRecording) {
            stopRecording();
        }
    };
  }, [isRecording, stopRecording]);


  const resetAllModes = () => {
    setError(null);
    setIsLoading(false);
    setImageFile(null);
    setImageUrl(null);
    setPhotoAnalysis(null);
    setScannedItem(null);
    setManualBarcode('');
    if(isRecording) stopRecording();
    setTranscribedText('');
    setVoiceAnalysis(null);
    setManualItems([{ id: Date.now(), name: '', quantity: '' }]);
    setManualAnalysis(null);
  }

  const handleModeChange = (newMode: 'photo' | 'barcode' | 'voice' | 'manual') => {
    resetAllModes();
    setMode(newMode);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setPhotoAnalysis(null);
      setError(null);
      handleAnalyzePhoto(file);
    }
  };

  const handleAnalyzePhoto = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const base64Image = await fileToBase64(file);
      const result = await analyzeFoodImage(base64Image);
      setPhotoAnalysis(result.map(item => ({ ...item, quantity: 1 })));
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMeal = (items: LoggableFoodItem[], source: Meal['source'], mealNameOverride?: string) => {
    if (!items || items.length === 0) return;
    
    const totalNutrition = calculateTotalNutrition(items);
    const mealName = mealNameOverride || items.map(item => `${item.name} (${item.quantity} serving${item.quantity !== 1 ? 's' : ''})`).join(', ');
    const now = new Date();

    const newMeal: Meal = {
      id: now.toISOString(),
      name: mealName,
      nutrition: totalNutrition,
      imageUrl: imageUrl ?? undefined,
      items: items,
      date: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      source,
      mealType: selectedMealType
    };
    addMeal(newMeal);
    showToast('Meal added successfully!');
    onClose();
  };
  
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode) return;
    setIsLoading(true);
    setError(null);
    setScannedItem(null);
    try {
      const item = await getFoodItemFromBarcode(barcode);
      if (item) {
        setScannedItem({ ...item, quantity: 1 });
      } else {
        setError(`Product with barcode ${barcode} not found.`);
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while fetching product data.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (mode !== 'barcode' || scannedItem) {
      return;
    }

    let detector: any = null;

    const stopScanner = () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const detectBarcode = async () => {
      if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            stopScanner();
            handleScan(barcodes[0].rawValue);
            return;
          }
        } catch (err) { console.error("Barcode detection failed:", err); }
      }
      animationFrameId.current = requestAnimationFrame(detectBarcode);
    };

    const startScanner = async () => {
      if (!('BarcodeDetector' in window)) {
        setError("Barcode scanning is not supported by your browser.");
        return;
      }
      try {
        // @ts-ignore
        detector = new BarcodeDetector({ formats: ['ean_13', 'upc_a', 'upc_e'] });
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(detectBarcode);
        }
      } catch (err) {
        setError("Could not access camera. Please check permissions.");
      }
    };
    startScanner();
    return () => stopScanner();
  }, [mode, scannedItem, handleScan]);


  const startRecording = useCallback(async () => {
    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        setTranscribedText('');
        setVoiceAnalysis(null);
        setError(null);
        setIsLoading(false);
        setIsRecording(true);

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContextRef.current.createMediaStreamSource(streamRef.current!);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
                        sessionPromiseRef.current?.then((session) => {
                           session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
                        });
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination);
                },
                onclose: () => {},
                onerror: (e) => { setError('Voice recognition service failed.'); stopRecording(); },
                onmessage: (message) => {
                    if (message.serverContent?.inputTranscription) {
                        setTranscribedText(prev => prev + message.serverContent.inputTranscription.text);
                    }
                }
            },
            config: { inputAudioTranscription: {} }
        });
    } catch (err) {
        setError("Could not access microphone. Please check permissions.");
        setIsRecording(false);
    }
  }, [stopRecording]);

  const handleToggleRecording = useCallback(() => { isRecording ? stopRecording() : startRecording(); }, [isRecording, startRecording, stopRecording]);

  const handleManualItemChange = (id: number, field: 'name' | 'quantity', value: string) => {
    setManualItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const addManualItem = () => setManualItems(items => [...items, { id: Date.now(), name: '', quantity: '' }]);
  const removeManualItem = (id: number) => {
    setManualItems(items => items.length > 1 ? items.filter(item => item.id !== id) : [{ id: Date.now(), name: '', quantity: '' }]);
  };
  const handleAnalyzeManual = async () => {
    const description = manualItems.map(item => `${item.quantity} ${item.name}`.trim()).filter(item => item).join(', ');
    if (!description.trim()) return;
    setIsLoading(true);
    setError(null);
    setManualAnalysis(null);
    try {
        const result = await analyzeFoodFromText(description);
        if (result.length === 0) setError("The AI couldn't identify any food items. Please be more specific.");
        else setManualAnalysis(result.map(item => ({ ...item, quantity: 1 })));
    } catch (e: any) { setError(e.message || 'An unknown error occurred.'); } 
    finally { setIsLoading(false); }
  };

  const renderAnalysisResults = (analysis: LoggableFoodItem[], setAnalysis: (items: LoggableFoodItem[]) => void, source: Meal['source']) => (
    <div className="space-y-4 my-4">
      <h3 className="font-semibold text-lg">Analysis Results:</h3>
      {analysis.map((item, index) => (
        <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="font-bold text-gray-800 dark:text-gray-100">{item.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{Math.round(item.calories)} kcal &bull; P:{Math.round(item.protein)}g C:{Math.round(item.carbs)}g F:{Math.round(item.fat)}g</p>
          <QuantityControl
              quantity={item.quantity}
              setQuantity={(q) => {
                  const newAnalysis = [...analysis];
                  newAnalysis[index].quantity = q;
                  setAnalysis(newAnalysis);
              }}
          />
        </div>
      ))}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {mealTypes.map(({type, icon}) => (
            <button key={type} onClick={() => setSelectedMealType(type)} className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center text-center gap-1 ${selectedMealType === type ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/40' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <Icon path={icon} className={`w-5 h-5 ${selectedMealType === type ? 'text-teal-500' : 'text-gray-500'}`}/>
                <span className="text-xs font-medium">{type}</span>
            </button>
          ))}
        </div>
        <button onClick={() => handleAddMeal(analysis, source)} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">Add to Diary</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg mx-auto relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon path="M6 18L18 6M6 6l12 12" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Log a Meal</h2>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            {['photo', 'manual', 'voice', 'barcode'].map((m) => {
                const icons: Record<string, string> = {
                    photo: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z",
                    manual: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125",
                    voice: "M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z",
                    barcode: "M3.75 4.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75H3.75zM8.25 15a.75.75 0 01-.75-.75V12a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H8.25z"
                };
                return (
                    <button key={m} onClick={() => handleModeChange(m as any)} className={`flex-1 py-2 font-semibold transition-colors duration-200 ${mode === m ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        <div className="flex items-center justify-center gap-2">
                            <Icon path={icons[m]} className="w-5 h-5"/>
                            <span className="capitalize">{m}</span>
                        </div>
                    </button>
                )
            })}
        </div>
        
        {mode === 'photo' && (
          <>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            {!imageUrl && !isLoading && (
              <div onClick={() => fileInputRef.current?.click()} className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <Icon path="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" className="mx-auto h-12 w-12 text-gray-400"/>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click to upload a photo</p>
              </div>
            )}
            {imageUrl && <div className="my-4"><img src={imageUrl} alt="Food" className="rounded-lg w-full max-h-64 object-contain" /></div>}
            {isLoading && <div className="my-4"><Loader text="Analyzing your meal..." /></div>}
            {error && <p className="my-4 text-center text-red-500">{error}</p>}
            {photoAnalysis && renderAnalysisResults(photoAnalysis, setPhotoAnalysis, 'photo')}
          </>
        )}

        {mode === 'manual' && (
            <div className="my-4 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Add food items one by one. Be as descriptive as you can with quantities.</p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {manualItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 animate-fade-in">
                            <input type="text" placeholder="e.g., Oatmeal" value={item.name} onChange={(e) => handleManualItemChange(item.id, 'name', e.target.value)} className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            <input type="text" placeholder="e.g., 1 cup" value={item.quantity} onChange={(e) => handleManualItemChange(item.id, 'quantity', e.target.value)} className="w-2/5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            <button onClick={() => removeManualItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Remove item"><Icon path="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6"/></button>
                        </div>
                    ))}
                </div>
                <button onClick={addManualItem} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><Icon path="M12 4.5v15m7.5-7.5h-15" className="w-5 h-5" />Add another item</button>
                <button onClick={handleAnalyzeManual} disabled={isLoading || manualItems.every(item => !item.name.trim())} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400">Analyze Meal</button>
                {isLoading && <Loader text="Analyzing description..." />}
                {error && <p className="text-center text-red-500">{error}</p>}
                {manualAnalysis && renderAnalysisResults(manualAnalysis, setManualAnalysis, 'manual')}
            </div>
        )}

        {mode === 'voice' && (
          <div className="my-4 space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                  <button onClick={handleToggleRecording} className={`rounded-full p-6 transition-colors duration-300 ${isRecording ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-500 hover:bg-teal-600'}`}>
                      {isRecording ? <Icon path="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" className="w-10 h-10 text-white"/> : <Icon path="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" className="w-10 h-10 text-white"/>}
                  </button>
                  <p className="text-gray-500 dark:text-gray-400 h-5">{isRecording ? 'Recording...' : 'Tap to speak'}</p>
              </div>
              {(transcribedText || isLoading || voiceAnalysis) && (<div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg min-h-[60px]"><p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">You said:</p><p className="text-gray-800 dark:text-gray-200">{transcribedText || '...'}</p></div>)}
              {isLoading && <Loader text="Analyzing your description..." />}
              {error && <p className="text-center text-red-500">{error}</p>}
              {voiceAnalysis && renderAnalysisResults(voiceAnalysis, setVoiceAnalysis, 'voice')}
          </div>
        )}

        {mode === 'barcode' && (
          <div className="space-y-4">
            {!scannedItem && (
              <div className="w-full h-48 bg-gray-900 flex flex-col items-center justify-center rounded-lg my-4 relative overflow-hidden">
                <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 bg-black/20 z-10"></div>
                <p className="text-white z-20 font-medium bg-black/50 px-3 py-1 rounded-md">Point camera at a barcode</p>
                <div className="absolute top-1/2 left-0 w-full h-1 bg-red-500/70 -translate-y-1/2 animate-scan-line z-20"></div>
                <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white/20 rounded z-20"></div>
              </div>
            )}
            {isLoading && <Loader text="Looking up barcode..." />}
            {scannedItem && renderAnalysisResults([scannedItem], (items) => setScannedItem(items[0]), 'barcode')}
            {!scannedItem && !isLoading && (
              <form onSubmit={(e) => { e.preventDefault(); handleScan(manualBarcode); }} className="space-y-2 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Or enter barcode manually:</p>
                  <div className="flex gap-2">
                      <input type="text" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} placeholder="Enter barcode number" className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                      <button type="submit" className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600" disabled={isLoading || !manualBarcode}>Submit</button>
                  </div>
              </form>
            )}
            {error && <div className="text-center mt-4 space-y-2"><p className="text-center text-red-500">{error}</p><button onClick={() => { setError(null); setManualBarcode(''); }} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Try Again</button></div>}
            <style>{`@keyframes scan-line { 0% { transform: translateY(-90px); } 100% { transform: translateY(90px); } } .animate-scan-line { animation: scan-line 2s ease-in-out infinite alternate; }`}</style>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FoodLogger;