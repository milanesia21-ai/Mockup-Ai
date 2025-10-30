
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 mr-2"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,5 12,5C14.5,5 16.22,6.17 17.06,6.95L19.25,4.76C17.33,3.07 14.86,2 12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,11.64 21.95,11.31 21.86,11H21.35V11.1Z"></path></svg>);
const AppleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 mr-2"><path fill="currentColor" d="M17.2,20.55C16.3,21.4 15.1,22 14,22C12.5,22 11.5,21.2 10.5,20.1C9.5,19 8.8,17.6 8.8,16C8.8,14.4 9.5,13.1 10.5,12.1C11.5,11.1 12.6,10.5 14,10.5C14.4,10.5 15.2,10.6 16.1,10.9L16.4,10.95L16.5,11C16.5,11 16.5,11 16.5,11C16.5,11 16.5,11 16.5,11C17.3,11.3 17.9,11.9 18.2,12.6C17.4,13.1 17,13.8 17,14.7C17,15.8 17.5,16.7 18.4,17.2C18.3,17.3 18.3,17.3 18.2,17.4C17.6,18.1 17,18.7 16.2,19.2C15.5,19.7 14.7,20 14,20C13.6,20 13.2,19.9 12.8,19.7C12.4,19.5 12,19.2 11.7,18.8C11.4,18.4 11.2,17.9 11.2,17.2C11.2,16.5 11.5,15.8 12,15.3C12.5,14.8 13.2,14.5 14,14.5C14.8,14.5 15.5,14.8 16,15.3C16.2,15.5 16.3,15.8 16.4,16.1L16.5,16.3L19.2,15.2C19.1,13.6 18.3,12.3 17,11.4C16.1,10.8 15,10.5 14,10.5C12.6,10.5 11.4,11 10.4,12C9.4,13 8.8,14.3 8.8,15.9C8.8,17.5 9.4,18.9 10.4,20C11.4,21.1 12.6,21.7 14,21.7C15.1,21.7 16.1,21.3 17,20.45C17.3,20.15 17.6,19.85 17.8,19.45L18,19.1L17.2,20.55M16.3,4.4C15.9,3.9 15.3,3.5 14.7,3.2C14.1,2.9 13.5,2.7 12.7,2.7C11.2,2.7 9.9,3.3 9,4.4C8.1,5.5 7.7,6.8 7.7,8.2C7.7,9.7 8.1,11 9.1,12C9.5,12.5 10.1,12.9 10.7,13.2C11.3,13.5 12,13.7 12.7,13.7C14.2,13.7 15.5,13.1 16.4,12C17.3,10.9 17.7,9.6 17.7,8.1C17.7,6.7 17.2,5.5 16.3,4.4M15,8.1C15,9.1 14.7,9.9 14,10.4C13.3,10.9 12.5,11.2 11.5,11.2C10.5,11.2 9.7,10.9 9,10.4C8.3,9.9 8,9.1 8,8.1C8,7.1 8.3,6.3 9,5.8C9.7,5.3 10.5,5 11.5,5C12.5,5 13.3,5.3 14,5.8C14.7,6.3 15,7.1 15,8.1Z" /></svg>);

export const LoginView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup } = useContext(AuthContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(email);
    } else {
      signup(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
           <h1 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-orange-500 dark:from-gray-300 dark:to-orange-400">
            Apparel Mockup AI
          </h1>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
        </div>

        <div className="flex justify-center gap-4">
            <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <GoogleIcon /> Continue with Google
            </button>
            <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <AppleIcon /> Continue with Apple
            </button>
        </div>

         <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password-for-password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {isLogin ? 'Sign in' : 'Create Account'}
            </button>
          </div>
        </form>
         <div className="text-sm text-center">
            <a href="#" onClick={() => setIsLogin(!isLogin)} className="font-medium text-orange-600 hover:text-orange-500">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </a>
          </div>
      </div>
    </div>
  );
};
