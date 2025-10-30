
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 flex-shrink-0">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div 
            className="flex items-center gap-2"
        >
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-orange-500 dark:from-gray-300 dark:to-orange-400">
            Apparel Mockup AI
            </h1>
        </div>
      </div>
    </header>
  );
};
