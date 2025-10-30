
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'it';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  clearCache: () => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  theme: 'system',
  language: 'en',
  setTheme: () => {},
  setLanguage: () => {},
  clearCache: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    const storedLang = localStorage.getItem('app-lang') as Language | null;
    
    setThemeState(storedTheme || 'system');
    setLanguageState(storedLang || 'en');
  }, []);

  const applyTheme = useCallback((themeToApply: Theme) => {
    if (themeToApply === 'dark' || (themeToApply === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme(theme);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem('app-theme', newTheme);
    setThemeState(newTheme);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    localStorage.setItem('app-lang', newLang);
    setLanguageState(newLang);
  }, []);
  
  const clearCache = useCallback(() => {
    // A more robust implementation would target specific keys
    const theme = localStorage.getItem('app-theme');
    const lang = localStorage.getItem('app-lang');
    const user = localStorage.getItem('authUser');
    
    localStorage.clear();
    
    if(theme) localStorage.setItem('app-theme', theme);
    if(lang) localStorage.setItem('app-lang', lang);
    if(user) localStorage.setItem('authUser', user);

    alert('Cache cleared!');
  }, []);

  const value = useMemo(() => ({ theme, language, setTheme, setLanguage, clearCache }), [theme, language, setTheme, setLanguage, clearCache]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
