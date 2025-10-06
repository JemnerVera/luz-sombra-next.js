'use client';

import React, { useState, useEffect } from 'react';
import { TabType } from '../types';
import { UI_CONFIG } from '../utils/constants';
import { Upload, Eye, BarChart3, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Aplicar tema al HTML
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'eye':
        return <Eye className="h-5 w-5" />;
      case 'bar-chart-3':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col lg:flex-row font-sans transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-full lg:w-64 bg-white dark:bg-dark-900 shadow-2xl flex-shrink-0 border-r border-gray-200 dark:border-dark-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">
            🌱 Agricola Luz-Sombra
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 font-medium">
            Análisis de imágenes agrícolas con ML
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {UI_CONFIG.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TabType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg font-medium text-sm transition-all duration-200 ${
                  currentTab === tab.id
                    ? 'bg-primary-600 text-white border-r-2 border-primary-400 shadow-lg'
                    : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white hover:shadow-md'
                }`}
              >
                {getIcon(tab.icon)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isDark ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-700">
          <div className="text-xs text-gray-500 dark:text-dark-400 text-center font-medium">
            © 2024 Agricola Luz-Sombra v2.0.0
            <br />
            Powered by Next.js + TensorFlow.js
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-dark-950">
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
