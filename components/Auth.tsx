
import React, { useState } from 'react';
import { signIn, signUp, resetPassword } from '../services/supabaseService';
import Card from './common/Card';
import Icon from './common/Icon';
import Logo from './common/Logo';

type AuthMode = 'signin' | 'signup' | 'forgot';

const Auth: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        setError(null);
        setMessage(null);
        
        try {
            if (mode === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) throw error;
                setMessage("Check your email for the password reset link.");
                setMode('signin');
            } else if (mode === 'signup') {
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters long.");
                }
                const { data, error } = await signUp(email, password);
                if (error) throw error;
                
                // Supabase specific: if session is null but user exists, email confirmation is required
                if (data?.user && !data.session) {
                    setMessage("Account created! Please check your email to confirm your account before signing in.");
                    setMode('signin');
                }
                // If session exists, DataContext will handle the redirect via onAuthStateChange
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGuestLogin = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            // Attempt guest login. This will fallback to mock mode in supabaseService if the account doesn't exist remotely.
            const { error } = await signIn('guest@visioncal.app', 'password');
            if (error) throw error;
        } catch (err: any) {
             console.error("Guest login error:", err);
            setError("Could not sign in as guest. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <main className="h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-teal-400/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

            <Card className="w-full max-w-sm z-10 shadow-2xl border-white/20 dark:border-gray-700/50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/20 mb-4">
                        <Logo className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">VisionCal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {mode === 'signup' ? "Start your journey today." : mode === 'forgot' ? "Recover your account." : "Welcome back."}
                    </p>
                </div>

                {message && (
                    <div className="mb-6 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg flex items-start gap-2">
                        <Icon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-start gap-2">
                        <Icon path="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icon path="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                                {mode === 'signin' && (
                                    <button type="button" onClick={() => { setMode('forgot'); setError(null); setMessage(null); }} className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500">
                                        Forgot?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                        {showPassword ? 
                                            <Icon path="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="h-5 w-5" /> :
                                            <Icon path="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" className="h-5 w-5" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            mode === 'signup' ? "Create Account" : mode === 'forgot' ? "Send Reset Link" : "Sign In"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    {mode === 'forgot' ? (
                        <button onClick={() => { setMode('signin'); setError(null); setMessage(null); }} className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500">
                            Back to Sign In
                        </button>
                    ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}
                            <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setMessage(null); }} className="font-bold text-teal-600 dark:text-teal-400 hover:text-teal-500 ml-1">
                                {mode === 'signup' ? "Sign In" : "Sign Up"}
                            </button>
                        </p>
                    )}
                </div>
            </Card>
            
            <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="mt-8 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isLoading && email === '' && mode === 'signin' ? ( // Heuristic to check if guest login is active
                    <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                Continue as Guest (Demo Mode)
            </button>
        </main>
    );
};

export default Auth;
