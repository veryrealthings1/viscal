import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, createUser } from '../services/firebaseService';
import Card from './common/Card';
import Icon from './common/Icon';
import Loader from './common/Loader';

const Auth: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                await createUser(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-6">
                <div className="text-center">
                    <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" className="w-12 h-12 mx-auto text-teal-500 mb-2"/>
                    <h1 className="text-3xl font-bold">Welcome to VisionCal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{isSignUp ? 'Create an account to get started' : 'Sign in to continue'}</p>
                </div>

                {isLoading ? <Loader text="Signing in..." /> : (
                    <>
                        <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold">
                            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.057 4.717C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-4.823C29.211 35.091 26.715 36 24 36c-5.223 0-9.65-3.657-11.303-8.623l-6.057 4.717C9.043 39.636 15.959 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.443-2.671 4.349-5.097 5.62l6.19 4.823C42.012 35.15 44 30.021 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                            Continue with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            <button type="submit" className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        {/* FIX: Use local `error` state instead of `authError` from context, which is not provided. */}
                        {error && <p className="text-center text-red-500 text-sm">{error}</p>}

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-semibold text-teal-500 hover:text-teal-400 ml-1">
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </>
                )}
            </Card>
        </main>
    );
};

export default Auth;