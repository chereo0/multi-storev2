import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg transition-all duration-300 ease-in-out
        ${isDarkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400 hover:text-yellow-300' 
          : 'bg-gray-100 hover:bg-gray-200 text-yellow-600 hover:text-yellow-700'
        }
        shadow-lg hover:shadow-xl transform hover:scale-105
        border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDarkMode ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
