import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useLanguage } from '../contexts/LanguageContext'; // <--- GIỮ LẠI ĐỂ SỬ DỤNG t
import ArcPayLogo from '../assets/arc.svg';// API Endpoint ArcScan để lấy giá gas
const GAS_API_URL = 'https://testnet.arcscan.app/api/v2/stats';


const Header = ({ onGoHome }) => {
  const { t } = useLanguage();
  const [gasPrice, setGasPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useAccount();

  // Logic fetch giá gas
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const response = await fetch(GAS_API_URL);
        const data = await response.json();

        const avgGasPriceGwei = data?.gas_prices?.average;

        if (avgGasPriceGwei !== undefined) {
          // Làm tròn và gán giá trị
          const formattedPrice = Math.round(avgGasPriceGwei);
          setGasPrice(formattedPrice);
        } else {
          setGasPrice('N/A');
        }
      } catch (error) {
        console.error("Lỗi khi tải giá gas:", error);
        setGasPrice('N/A');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch lần đầu và sau đó lặp lại mỗi 30 giây
    fetchGasPrice();
    const intervalId = setInterval(fetchGasPrice, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="border-b border-gray-800 px-6 py-4 bg-gray-900 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Logo/Tên Ứng Dụng - ĐÃ THÊM onClick và styling con trỏ */}
        <div
          onClick={onGoHome}
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          <h1 className="flex items-center text-2xl font-bold text-white">
            <img 
              src={ArcPayLogo} // <-- Sử dụng URL của logo
              alt="ArcPay Logo" 
              className="w-6 h-6 mr-2" // Điều chỉnh kích thước tại đây
            /> 
            <span className="text-purple-400">Arc</span>Pay
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg text-gray-400 text-sm font-medium">
            <span className="text-yellow-500">⚡️</span>
            Gas: {isLoading
              ? '...'
              : gasPrice === 'N/A'
                ? 'N/A'
                : `${gasPrice} Gwei`
            }
          </div>

          {/* Nút Kết nối Ví RainbowKit */}
          <ConnectButton
            chainStatus="icon"
            showBalance={isConnected}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;