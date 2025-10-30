
import React, { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

interface SettingsViewProps {
  setView: (view: 'mockup' | 'profile' | 'settings') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ setView }) => {
  const { theme, setTheme, language, setLanguage, clearCache } = useContext(SettingsContext);
  
  const t = (en: string, it: string) => (language === 'it' ? it : en);

  const SettingSection: React.FC<{ title: string, description: string, children: React.ReactNode }> = ({ title, description, children }) => (
      <div className="py-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
          {children}
      </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
       <button onClick={() => setView('mockup')} className="mb-6 text-sm text-orange-500 hover:underline">
        &larr; {t('Back to Mockup Generator', 'Torna al Generatore di Mockup')}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6">{t('Settings', 'Impostazioni')}</h2>
        
        {/* Theme Settings */}
        <SettingSection 
            title={t('Appearance', 'Aspetto')}
            description={t('Customize the look and feel of the app.', 'Personalizza l\'aspetto dell\'app.')}
        >
            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="form-radio text-orange-500"/>
                    <span className="ml-2">{t('Light', 'Chiaro')}</span>
                </label>
                <label className="flex items-center">
                    <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="form-radio text-orange-500"/>
                    <span className="ml-2">{t('Dark', 'Scuro')}</span>
                </label>
                <label className="flex items-center">
                    <input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => setTheme('system')} className="form-radio text-orange-500"/>
                    <span className="ml-2">{t('System', 'Sistema')}</span>
                </label>
            </div>
        </SettingSection>

        {/* Language Settings */}
        <SettingSection 
            title={t('Language', 'Lingua')}
            description={t('Change the interface language.', 'Cambia la lingua dell\'interfaccia.')}
        >
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as 'en' | 'it')}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2"
             >
                <option value="en">English</option>
                <option value="it">Italiano</option>
            </select>
        </SettingSection>

        {/* Support & Info */}
        <SettingSection 
            title={t('Support & Info', 'Supporto e Informazioni')}
            description={t('Find help and information about the app.', 'Trova aiuto e informazioni sull\'app.')}
        >
            <div className="flex flex-col sm:flex-row gap-4">
                <a href="#" className="flex-1 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-md">{t('Contact Support', 'Contatta il Supporto')}</a>
                <a href="#" className="flex-1 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-md">{t('Terms of Service', 'Termini di Servizio')}</a>
                <a href="#" className="flex-1 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-md">{t('Privacy Policy', 'Informativa Privacy')}</a>
            </div>
        </SettingSection>

        {/* Data Management */}
         <SettingSection 
            title={t('Data Management', 'Gestione Dati')}
            description={t('Manage app data and cache.', 'Gestisci i dati e la cache dell\'app.')}
        >
            <button onClick={clearCache} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-3 rounded-md font-semibold">{t('Clear Cache', 'Svuota Cache')}</button>
        </SettingSection>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Apparel Mockup AI - Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};
