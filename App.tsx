
import React, { useContext } from 'react';
import { Toaster } from 'sonner';
import { SettingsProvider, SettingsContext } from './contexts/SettingsContext';
import { MockupView } from './views/MockupView';
import { Header } from './components/Header';

const AppContent: React.FC = () => {
  const { language } = useContext(SettingsContext);

  // Set the language on the HTML element for global styling/accessibility
  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col h-screen overflow-hidden">
      <Toaster position="top-right" richColors theme="dark" />
      <Header />
      <MockupView />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
