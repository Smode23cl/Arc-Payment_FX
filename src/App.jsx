// src/App.jsx

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { DollarSign, BarChart3, Clock, Menu, X } from 'lucide-react';
import '@rainbow-me/rainbowkit/styles.css';

// Import cấu hình Arc Testnet và Wagmi mới
import { arcTestnet } from './config/chains';
import { config } from './wagmiConfig';

// Import các components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import PaymentForm from './components/PaymentForm';
import TransactionHistory from './components/TransactionHistory';
import FXRates from './components/FXRates';
import SwapForm from './components/SwapForm';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import TabBar from './components/TabBar';

// ===========================
// REACT QUERY CLIENT (GIỮ NGUYÊN)
// ===========================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// ===========================
// APP CONTENT (ĐÃ SỬA)
// ===========================
const AppContent = () => {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState('landing');
  const [swapPair, setSwapPair] = useState(null);

  const renderContent = () => {
    switch (currentTab) {
      case 'payment':
        return <PaymentForm />;
      case 'rates':
        return <FXRates onSwapClick={(pair) => {
          setSwapPair(pair);
          setCurrentTab('swap');
        }} />;
      case 'history':
        return <TransactionHistory />;
      case 'swap':
        return <SwapForm t={t.swap} defaultPair={swapPair} onCancel={() => setCurrentTab('payment')} />;
      case 'landing':
      default:
        return <LandingPage onStart={() => setCurrentTab('payment')} />;
    }
  };

  const isLanding = currentTab === 'landing';

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">

      {/* ẨN HEADER KHI Ở TRANG LANDING */}
      {!isLanding && (
        <Header onGoHome={() => setCurrentTab('landing')} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      )}

      <main className={`flex-grow ${isLanding ? 'p-0' : 'p-4 pt-10 max-w-7xl mx-auto w-full'}`}>
        {!isLanding && currentTab !== 'swap' && ( // Ẩn khi ở SwapForm
          <TabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        )}
        {renderContent()}
      </main>

      {/* Footer (GIỮ NGUYÊN) */}
      <footer className="border-t border-gray-700 mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">{t.app.footer}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Powered by Arc Testnet</span>
              <span>•</span>
              <span>Built with React & Wagmi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ===========================
// ROOT APP COMPONENT (GIỮ NGUYÊN)
// ===========================
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8b5cf6',
            accentColorForeground: 'white',
            borderRadius: 'large',
          })}
          chains={[arcTestnet]}
          modalSize="compact"
          showRecentTransactions={true}
          appInfo={{
            appName: 'Arc FX Payment',
            disclaimer: ({ Text }) => (
              <Text>
                Kết nối ví của bạn để sử dụng Arc FX Payment. Đảm bảo bạn đang kết
                nối với Arc Testnet.
              </Text>
            ),
          }}
        >
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}