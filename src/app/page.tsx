'use client';

import React, { useState, useEffect } from 'react';
import { TabType } from '../types';
import Layout from '../components/Layout';
import ImageUploadForm from '../components/ImageUploadForm';
import ModelTestForm from '../components/ModelTestForm';
import HistoryTable from '../components/HistoryTable';
import Notification from '../components/Notification';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<TabType>('analizar');
  const [hasUnsavedData, setHasUnsavedData] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // Load EXIF library on app start
  useEffect(() => {
    // Load EXIF.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/exif-js@2.3.0/exif.js';
    script.onload = () => console.log('✅ EXIF.js loaded');
    script.onerror = () => console.error('❌ Failed to load EXIF.js');
    document.head.appendChild(script);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const [showModal, setShowModal] = useState(false);

  const handleTabChange = (tab: TabType) => {
    if (hasUnsavedData && currentTab === 'analizar') {
      setPendingTab(tab);
      setShowModal(true);
    } else {
      setCurrentTab(tab);
      setHasUnsavedData(false);
    }
  };

  const confirmTabChange = () => {
    if (pendingTab) {
      setCurrentTab(pendingTab);
      setHasUnsavedData(false);
      setPendingTab(null);
    }
    setShowModal(false);
  };

  const cancelTabChange = () => {
    setPendingTab(null);
    setShowModal(false);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'analizar':
        return (
          <ImageUploadForm 
            onUnsavedDataChange={setHasUnsavedData}
            onNotification={showNotification}
          />
        );
      case 'probar':
        return (
          <ModelTestForm 
            onNotification={showNotification}
          />
        );
      case 'historial':
        return (
          <HistoryTable 
            onNotification={showNotification}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Layout
        currentTab={currentTab}
        onTabChange={handleTabChange}
      >
        {renderTabContent()}
      </Layout>
      
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />

      {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-dark-700 shadow-2xl animate-scale-in">
              <div className="flex justify-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 dark:text-dark-300 mb-6 text-center">
                Tienes información sin guardar en la pestaña &quot;Analizar Imágenes&quot;.
                Si cambias de pestaña, se perderán los datos ingresados.
              </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={confirmTabChange}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Aceptar
              </button>
              <button
                onClick={cancelTabChange}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}