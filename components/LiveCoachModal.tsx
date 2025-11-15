import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from "@google/genai";
import Card from './common/Card';
import Icon from './common/Icon';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';
import { encode, decode, decodeAudioData, initialNutrition } from '../services/utils';
import { analyzeFoodFromText, ai, calculatePersonalizedGoals } from '../services/geminiService';
import type { Meal, MealType, NutritionInfo, AnalyzedFoodItem } from '../types';

const calculateTotalNutrition = (items: AnalyzedFoodItem[]): NutritionInfo => {
    return items.reduce((acc, item) => {
        for (const key in initialNutrition) {
            const nutrientKey = key as keyof NutritionInfo;
            if (typeof item[nutrientKey] === 'number') {
                acc[nutrientKey] = (acc[nutrientKey] ?? 0) + (item[nutrientKey]!);
            }
        }
        return acc;
    }, { ...initialNutrition });
};

type ToolStatusResult = {
  status: 'success' | 'error';
  message: string;
};
type TodaysSummaryResult = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
};
type ToolCallResult = ToolStatusResult | TodaysSummaryResult;


const LiveCoachModal: React.FC = () => {
    const { meals, userProfile, dailyGoal, addMeal, addWaterLog, todaysNutrition, todaysWaterIntake, setDailyGoal } = useData();
    const { setActiveModal, showToast } = useUI();
    const onClose = () => setActiveModal(null);

    const [status, setStatus] = useState<'idle' | 'listening' | 'connecting' | 'speaking' | 'error'>('idle');
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    // Refs for audio I/O
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    // Refs for audio playback queue
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);


    const stopSession = useCallback(() => {
        // Stop input stream processing
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        
        // Stop any currently playing output audio
        if (sourcesRef.current) {
            sourcesRef.current.forEach(source => source.stop());
            sourcesRef.current.clear();
        }
        nextStartTimeRef.current = 0;
        
        // Close the Gemini session
        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        setStatus('idle');
    }, []);

    // Initialize and cleanup audio contexts
    useEffect(() => {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputNodeRef.current = outputAudioContextRef.current.createGain();
        outputNodeRef.current.connect(outputAudioContextRef.current.destination);

        return () => {
            stopSession();
            outputAudioContextRef.current?.close().catch(console.error);
        };
    }, [stopSession]);


    const startSession = useCallback(async () => {
        if (sessionPromiseRef.current) return;
        
        setStatus('connecting');
        setUserTranscript('');
        setModelTranscript('');
        setInterimTranscript('');
        
        const logMeal: FunctionDeclaration = { name: 'logMeal', parameters: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, mealType: { type: Type.STRING } }, required: ['description', 'mealType'] } };
        const logWater: FunctionDeclaration = { name: 'logWater', parameters: { type: Type.OBJECT, properties: { amount: { type: Type.NUMBER, description: 'Amount in ml' } }, required: ['amount'] } };
        const getTodaysSummary: FunctionDeclaration = { name: 'getTodaysSummary', parameters: { type: Type.OBJECT, properties: {} } };
        const recalculateAllGoals: FunctionDeclaration = {
          name: 'recalculateAllGoals',
          parameters: {
            type: Type.OBJECT,
            description: "Recalculates all daily nutritional goals based on a new user aspiration like 'I want to grow taller'.",
            properties: {}
          }
        };

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentMeals = meals.filter(m => new Date(m.date) >= sevenDaysAgo);

            const mealHistorySummary = recentMeals.map(m => {
                const date = new Date(m.date);
                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                return `- ${day}, ${m.mealType}: ${m.name}`;
            }).slice(-10).join('\n'); // Keep it concise for voice
            
            const systemInstruction = `You are a friendly, enthusiastic voice assistant for the VisionCal nutrition app. You have access to the user's recent meal log to understand their habits.
- User Profile: Age ${userProfile.age}, Weight ${userProfile.weight}kg, Goal: ${userProfile.aspirations}.
- Recent Meals Log:
${mealHistorySummary || "No recent meals logged."}
- When providing nutritional advice, it's critical that you understand the difference between individual healthy ingredients and a prepared dish. For example, while tomatoes are healthy, a hamburger containing them is often high in fat and sodium due to the ground meat, bun, and sauces. Always consider the context of the entire meal.
- Keep responses very short and conversational.
- Use your knowledge of their past meals to give personalized advice.
- Use tools to log meals/water and get summaries. Confirm actions clearly, e.g., "Okay, logged it!".
- If the user asks for their summary, call getTodaysSummary.
- If they want to log food, call logMeal with a description and inferred meal type.
- If they want to log water, call logWater with the amount in ml.
- If the user expresses a new goal like 'I want to grow taller', use \`recalculateAllGoals\`.`;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [logMeal, logWater, getTodaysSummary, recalculateAllGoals] }],
                    systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
                            const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onclose: () => {},
                    onerror: (e) => { console.error(e); setStatus('error'); stopSession(); },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setInterimTranscript(message.serverContent.inputTranscription.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setModelTranscript(prev => prev + message.serverContent.outputTranscription.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setUserTranscript(prev => prev + ' ' + interimTranscript);
                            setModelTranscript('');
                            setInterimTranscript('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const audioContext = outputAudioContextRef.current;
                            const outputNode = outputNodeRef.current;

                            if (audioContext && outputNode) {
                                setStatus('speaking');
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                                
                                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                                const source = audioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);
                        
                                source.onended = () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) {
                                        setStatus('listening');
                                    }
                                };
                        
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            }
                        }

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result: ToolCallResult = { status: 'error', message: 'Unknown function' };
                                if (fc.name === 'recalculateAllGoals') {
                                    try {
                                        const newGoals = await calculatePersonalizedGoals(userProfile);
                                        setDailyGoal(newGoals);
                                        result = { status: 'success', message: 'Recalculated all goals.' };
                                        showToast('All your goals have been recalculated!');
                                    } catch(e) {
                                        result = { status: 'error', message: 'Failed to recalculate goals.' };
                                    }
                                } else if (fc.name === 'logMeal') {
                                    const { description, mealType } = fc.args as { description: string, mealType: MealType };
                                    const items = await analyzeFoodFromText(description);
                                    if (items.length > 0) {
                                        addMeal({
                                            id: new Date().toISOString(), name: items.map(i => i.name).join(', '),
                                            nutrition: calculateTotalNutrition(items), items, date: new Date().toISOString(),
                                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                                            source: 'voice', mealType: mealType || 'Snack',
                                        });
                                        result = { status: 'success', message: `Logged ${items.length} items.` };
                                        showToast(`Logged: ${items.map(i=>i.name).join(', ')}`);
                                    } else { result = { status: 'error', message: 'Could not identify food.' }; }
                                } else if (fc.name === 'logWater') {
                                    addWaterLog(fc.args.amount as number);
                                    result = { status: 'success', message: `Logged ${fc.args.amount}ml water.` };
                                    showToast(`Logged ${fc.args.amount}ml water`);
                                } else if (fc.name === 'getTodaysSummary') {
                                    result = {
                                        calories: Math.round(todaysNutrition.calories), protein: Math.round(todaysNutrition.protein),
                                        carbs: Math.round(todaysNutrition.carbs), fat: Math.round(todaysNutrition.fat),
                                        water: todaysWaterIntake
                                    };
                                }
                                sessionPromiseRef.current?.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: JSON.stringify(result) } } }));
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }, [addMeal, addWaterLog, showToast, stopSession, todaysNutrition, todaysWaterIntake, userProfile, setDailyGoal, meals]);

    const isSessionActive = status === 'listening' || status === 'speaking' || status === 'connecting';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <Card className="w-full max-w-md mx-auto relative h-[70vh] flex flex-col text-center" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Live AI Coach</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Icon path="M6 18L18 6M6 6l12 12" /></button>
                </header>
                <div className="flex-1 flex flex-col justify-center items-center p-4 space-y-4">
                    <p className="font-semibold text-lg min-h-[56px] text-gray-800 dark:text-gray-200">{modelTranscript || (isSessionActive ? "I'm listening..." : "Tap the mic to start")}</p>
                    <p className="text-base text-gray-500 dark:text-gray-400 min-h-[48px]">{userTranscript} <span className="opacity-70">{interimTranscript}</span></p>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                    <button 
                        onClick={isSessionActive ? stopSession : startSession}
                        className={`rounded-full p-6 transition-all duration-300 shadow-xl ${
                            status === 'listening' ? 'bg-teal-500 animate-pulse' :
                            status === 'speaking' ? 'bg-indigo-500' :
                            status === 'connecting' ? 'bg-amber-500' :
                            status === 'error' ? 'bg-rose-600' :
                            'bg-gray-600 hover:bg-teal-500'
                        }`}
                    >
                        <Icon path="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6z" className="w-12 h-12 text-white"/>
                    </button>
                    <p className="mt-4 font-semibold capitalize h-6">{status}</p>
                </div>
            </Card>
        </div>
    );
};

export default LiveCoachModal;
