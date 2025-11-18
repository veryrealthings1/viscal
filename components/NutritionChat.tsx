
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from "@google/genai";
import { FunctionDeclaration, Type } from "@google/genai";
import type { ChatMessage, Meal, UserProfile, NutritionInfo, AnalyzedFoodItem, MealType } from '../types';
import { getChat, speakText, analyzeFoodFromText, calculatePersonalizedGoals } from '../services/geminiService';
import { playAudio, calculateTotalNutrition } from '../services/utils';
import Icon from './common/Icon';
import Loader from './common/Loader';
import { useData } from '../hooks/useData';
import { useUI } from '../hooks/useUI';

const updateDailyGoalFunctionDeclaration: FunctionDeclaration = {
  name: 'updateDailyGoal',
  parameters: {
    type: Type.OBJECT,
    description: "Set or update the user's daily nutritional goals. Only include fields that are being changed.",
    properties: {
      calories: { type: Type.NUMBER, description: 'Target daily calories in kcal.' },
      protein: { type: Type.NUMBER, description: 'Target daily protein in grams.' },
      carbs: { type: Type.NUMBER, description: 'Target daily carbohydrates in grams.' },
      fat: { type: Type.NUMBER, description: 'Target daily fat in grams.' },
    },
  },
};

const updateUserProfileFunctionDeclaration: FunctionDeclaration = {
  name: 'updateUserProfile',
  parameters: {
    type: Type.OBJECT,
    description: 'Update the user\'s personal profile details.',
    properties: {
      age: { type: Type.NUMBER, description: 'User\'s age in years.' },
      weight: { type: Type.NUMBER, description: 'User\'s weight in kilograms.' },
      height: { type: Type.NUMBER, description: 'User\'s height in centimeters.' },
    },
  },
};

const logMealFunctionDeclaration: FunctionDeclaration = {
  name: 'logMeal',
  parameters: {
    type: Type.OBJECT,
    description: "Analyzes a user's description of a meal, gets nutritional information for each item, and logs it to their daily diary.",
    properties: {
      description: { 
          type: Type.STRING, 
          description: "A natural language description of the food and drinks consumed. For example: 'an apple and a glass of milk' or 'a bowl of chicken noodle soup'." 
      },
      mealType: {
          type: Type.STRING,
          description: "The type of meal. Must be one of: 'Breakfast', 'Lunch', 'Dinner', or 'Snack'. If the user doesn't specify, infer from the time of day or the food items."
      }
    },
    required: ['description', 'mealType'],
  },
};

const recalculateAllGoalsFunctionDeclaration: FunctionDeclaration = {
  name: 'recalculateAllGoals',
  parameters: {
    type: Type.OBJECT,
    description: "Recalculates all of the user's daily micro and macro nutritional goals based on their current profile and a newly expressed aspiration (e.g., 'I want to get stronger', 'I want to improve my skin health', 'I want to grow taller'). This should be used when the user states a new health or physical goal.",
    properties: {},
  },
};


const NutritionChat: React.FC = () => {
  const { meals, userProfile, dailyGoal, setUserProfile, setDailyGoal, addMeal, chatHistory, setChatHistory, waterLogs, exercises, currentStreak, unlockedAchievements, todaysNutrition, todaysWaterIntake, todaysCaloriesBurned } = useData();
  const { setActiveModal, showToast } = useUI();
  const onClose = () => setActiveModal(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessage, setSpeakingMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    // Sync local state with context.
    setMessages(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    // Initialize a single AudioContext for the component's lifecycle
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMeals = meals.filter(m => new Date(m.date) >= sevenDaysAgo);

    const mealHistorySummary = recentMeals.map(m => {
        const date = new Date(m.date);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return `- On ${day} at ${m.time}, for ${m.mealType}: ${m.name} (${Math.round(m.nutrition.calories)} kcal)`;
    }).join('\n');
    
    const waterSummary = `Avg daily water (last 7 days): ${Math.round(waterLogs.filter(w => new Date(w.date) >= sevenDaysAgo).reduce((acc, log) => acc + log.amount, 0) / 7 || 0)} ml`;
    const exerciseSummary = exercises
      .filter(e => new Date(e.date) >= sevenDaysAgo)
      .map(e => `- ${new Date(e.date).toLocaleDateString('en-US', {weekday: 'short'})}: ${e.name} (${e.durationMinutes} min, ${Math.round(e.caloriesBurned)} kcal)`)
      .join('\n');
    
    const goalSummary = Object.entries(dailyGoal)
        .map(([key, value]) => {
            if (value === null || value === undefined) return null;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return `- ${label}: ${value}`;
        })
        .filter(Boolean)
        .join('\n');

    const systemInstruction = `You are a friendly, personalized, and knowledgeable nutrition assistant for the VisionCal app. You have FULL access to the user's data and history. DO NOT ask the user for their basic details (age, weight, goals) as you already know them.

USER PROFILE (REMEMBER THIS):
- Age: ${userProfile.age}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Gender: ${userProfile.gender}
- Activity Level: ${userProfile.activityLevel}
- Primary Goal: ${userProfile.aspirations}
- Dietary Preference: ${userProfile.dietaryPreference}
- Target Weight: ${userProfile.targetWeight ? userProfile.targetWeight + ' kg' : 'Not set'}

TODAY'S PROGRESS:
- Calories: ${Math.round(todaysNutrition.calories)} / ${dailyGoal.calories} kcal
- Protein: ${Math.round(todaysNutrition.protein)} / ${dailyGoal.protein} g
- Water: ${Math.round(todaysWaterIntake)} / ${dailyGoal.waterGoal} ml
- Exercises Calories Burned: ~${Math.round(todaysCaloriesBurned)} kcal
- Current Streak: ${currentStreak} days
- Achievements Unlocked: ${unlockedAchievements.size}

HISTORY (LAST 7 DAYS):
Meals:
${mealHistorySummary || "No meals logged yet."}

Hydration:
${waterSummary}

Exercises:
${exerciseSummary || "No exercises logged yet."}

DAILY GOALS:
${goalSummary}

Your role is to act as a continuity of the user's journey.
- If the user asks "How am I doing?", analyze their TODAY'S PROGRESS and recent history.
- If the user wants to log food, use the 'logMeal' tool.
- If the user changes a goal, use 'updateDailyGoal' or 'recalculateAllGoals'.
- Be encouraging, concise, and never judgmental.
- "Remembering everything" means using the provided context to answer questions without needing the user to repeat themselves.`;

    const firebaseHistory = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // Filter out the last message if it's an empty placeholder from the model
    if (firebaseHistory.length > 0 && firebaseHistory[firebaseHistory.length - 1].role === 'model' && firebaseHistory[firebaseHistory.length - 1].parts[0].text === '') {
        firebaseHistory.pop();
    }
    
    setChat(getChat(
      firebaseHistory, 
      systemInstruction, 
      [{ functionDeclarations: [updateDailyGoalFunctionDeclaration, updateUserProfileFunctionDeclaration, logMealFunctionDeclaration, recalculateAllGoalsFunctionDeclaration] }]
    ));
  }, [meals, userProfile, dailyGoal, chatHistory, waterLogs, exercises, currentStreak, unlockedAchievements, todaysNutrition, todaysWaterIntake, todaysCaloriesBurned]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    const currentInput = userInput;
    const newMessagesWithUser = [...messages, userMessage];
    setMessages(newMessagesWithUser);
    setUserInput('');
    setIsLoading(true);

    try {
      let response = await chat.sendMessageStream({ message: currentInput });
      let text = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of response) {
        if (chunk.functionCalls) {
            setMessages(prev => {
                const newMessages = [...prev];
                if(newMessages[newMessages.length - 1].text === ''){ newMessages.pop(); }
                return newMessages;
            });
          
            const fc = chunk.functionCalls[0];
            let toolResult: any = { status: 'error', message: 'Unknown function' };

            if (fc.name === 'updateDailyGoal') {
                setDailyGoal(prev => ({ ...prev, ...fc.args }));
                showToast('Daily goals updated!');
                toolResult = { status: 'success', message: 'Daily goals updated.' };
            } else if (fc.name === 'updateUserProfile') {
                const newProfile = { ...userProfile, ...fc.args };
                setUserProfile(newProfile);
                showToast('Profile updated!');
                toolResult = { status: 'success', message: 'User profile updated.' };
            } else if (fc.name === 'logMeal') {
                const { description, mealType } = fc.args as { description: string, mealType: MealType };
                if (description) {
                    try {
                        const items = await analyzeFoodFromText(description);
                        if (items.length > 0) {
                            const totalNutrition = calculateTotalNutrition(items);
                            const mealName = items.map(item => item.name).join(', ');
                            const now = new Date();
                            const newMeal: Meal = {
                              id: now.toISOString(),
                              name: mealName,
                              nutrition: totalNutrition,
                              items: items,
                              date: now.toISOString(),
                              time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                              source: 'voice',
                              mealType: mealType || 'Snack'
                            };
                            addMeal(newMeal);
                            showToast(`Logged: ${mealName}`);
                            toolResult = { status: 'success', message: `Successfully logged: ${mealName}.` };
                        } else {
                            toolResult = { status: 'error', message: "Couldn't identify any food items in the description." };
                        }
                    } catch (error) {
                        toolResult = { status: 'error', message: "An error occurred while analyzing the food." };
                    }
                } else {
                    toolResult = { status: 'error', message: 'No description provided for logging.' };
                }
            } else if (fc.name === 'recalculateAllGoals') {
                try {
                    const newGoals = await calculatePersonalizedGoals(userProfile);
                    setDailyGoal(newGoals);
                    showToast("Your daily goals have been recalculated!");
                    toolResult = { status: 'success', message: 'All daily goals have been recalculated based on your new aspiration.' };
                } catch (error) {
                    toolResult = { status: 'error', message: "An error occurred while recalculating goals." };
                }
            }


            response = await chat.sendMessageStream({
                message: [{ functionResponse: { name: fc.name, response: { result: JSON.stringify(toolResult) } } }],
            });
            
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const finalChunk of response) {
                 text += finalChunk.text || '';
                 setMessages(prev => {
                     const newMessages = [...prev];
                     newMessages[newMessages.length - 1].text = text;
                     return newMessages;
                 });
            }

        } else {
           text += chunk.text || '';
           setMessages(prev => {
               const newMessages = [...prev];
               newMessages[newMessages.length - 1].text = text;
               return newMessages;
           });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
      // Using ref to get the most up-to-date messages state
      setChatHistory(messagesRef.current);
    }
  };

  const handleSpeak = async (text: string) => {
    if (speakingMessage || !audioContextRef.current) return;
    setSpeakingMessage(text);
    try {
      const audioB64 = await speakText(text);
      await playAudio(audioB64, audioContextRef.current);
    } catch (error) {
      console.error(error);
    } finally {
      setSpeakingMessage(null);
    }
  };

  return (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="bg-gray-100 dark:bg-gray-900 w-full h-full md:max-w-md md:h-[80vh] md:rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">AI Nutritionist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <Icon path="M6 18L18 6M6 6l12 12" />
          </button>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${msg.role === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                {msg.text}
                {msg.role === 'model' && msg.text && (
                  <button onClick={() => handleSpeak(msg.text)} className="ml-2 inline-block align-middle text-gray-400 hover:text-teal-500 disabled:opacity-50" disabled={!!speakingMessage}>
                    {speakingMessage === msg.text 
                      ? <Icon path="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 animate-spin"/>
                      : <Icon path="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l9 7.5" className="w-4 h-4"/>
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 rounded-bl-none"><Loader text="Thinking..."/></div></div>}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about your diet..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 disabled:bg-gray-400 transition-colors" disabled={isLoading || !userInput.trim()}>
              <Icon path="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NutritionChat;
