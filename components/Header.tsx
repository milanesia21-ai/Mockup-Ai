
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          Apparel Mockup AI
        </h1>
        <p className="mt-2 text-gray-400">
          Generate professional apparel mockups instantly with the power of Gemini.
        </p>
      </div>
    </header>
  );
};
