// src/components/FXRates.jsx (TÍCH HỢP STABLEFX)

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Info, ArrowLeftRight, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import StableFXService from '../hooks/stablex';

// Component helper cho Sparkline
const Sparkline = ({ change }) => {
  const isPositive = change.startsWith('+');

  return (
    <div className={`w-16 h-8 flex items-end justify-center overflow-hidden`}>
      <div className={`w-full h-full relative`}>
        <div className={`absolute bottom-0 left-0 w-1/4 h-2 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-50`}></div>
        <div className={`absolute bottom-0 left-1/4 w-1/4 h-5 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-75`}></div>
        <div className={`absolute bottom-0 left-2/4 w-1/4 h-3 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-50`}></div>
        <div className={`absolute bottom-0 left-3/4 w-1/4 h-6 ${isPositive ? 'bg-green-600' : 'bg-red-600'}`}></div>
      </div>
    </div>
  );
};

// Component chính
export default function FXRates({ t: propT, onSwapClick, fullWidth = false }) {
  const contextData = useLanguage();
  const t = propT || contextData?.t;

  const [rates, setRates] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [isLiveData, setIsLiveData] = useState(false);

  const stableFX = new StableFXService(); // Demo mode

  // Load rates on mount
  useEffect(() => {
    fetchRates();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRates = async () => {
    try {
      const ratesData = await stableFX.getRates();

      // Transform data để match với format UI
      const transformedRates = {};
      Object.entries(ratesData).forEach(([pair, data]) => {
        transformedRates[pair] = {
          rate: data.rate,
          change: data.change,
          volume: data.volume24h,
          high24h: data.high24h,
          low24h: data.low24h
        };
      });

      setRates(transformedRates);
      setLastUpdate(new Date());
      setIsLiveData(true);
    } catch (error) {
      console.error('Error fetching rates:', error);
      setIsLiveData(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={`bg-gray-900 rounded-xl shadow-2xl p-6 transition-all ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <TrendingUp className="w-7 h-7 text-purple-400" />
            {isLiveData && (
              <Zap className="w-3 h-3 text-green-400 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t.rates?.title || 'Tỷ giá hối đoái'}
            </h2>
            <p className="text-xs text-gray-400">
              {isLiveData ? 'Live from StableFX' : 'Demo Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {t.rates?.lastUpdate || 'Cập nhật'}: {lastUpdate.toLocaleTimeString('vi-VN')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 disabled:text-gray-600 disabled:animate-pulse"
            title={t.rates?.refresh || 'Làm mới'}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rates Grid */}
      {Object.keys(rates).length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(rates).map((pair) => {
            const data = rates[pair];
            const isPositive = data.change.startsWith('+');
            const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
            const changeBg = isPositive ? 'bg-green-900/30' : 'bg-red-900/30';

            return (
              <div
                key={pair}
                className={`
                  bg-gray-800 rounded-xl p-5 shadow-lg 
                  hover:shadow-purple-500/20 hover:border-purple-600/50 
                  transition-all duration-300 cursor-pointer
                  border border-gray-700
                  ${selectedPair === pair ? 'border-purple-600 ring-2 ring-purple-500/50' : ''}
                `}
                onClick={() => setSelectedPair(pair)}
              >
                <div className="flex justify-between items-start mb-3">
                  {/* Tên cặp tiền */}
                  <h3 className="text-lg font-bold text-white">{pair}</h3>
                  {/* Giá trị thay đổi */}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${changeColor} ${changeBg}`}>
                    {data.change}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  {/* Tỷ giá hiện tại */}
                  <div>
                    <p className="text-3xl font-extrabold text-purple-400 leading-none mb-1">
                      {typeof data.rate === 'number'
                        ? data.rate.toFixed(4)
                        : data.rate}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t.rates?.currentRate || 'Giá hiện tại'}</p>
                  </div>

                  {/* Sparkline và nút Swap */}
                  <div className="flex flex-col items-end gap-2">
                    <Sparkline change={data.change} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSwapClick) onSwapClick(pair);
                      }}
                      className="flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full transition-colors font-medium shadow-md hover:shadow-lg"
                      title={t.rates?.swap || 'Swap'}
                    >
                      <ArrowLeftRight className='w-4 h-4' /> {t.rates?.swap || 'Swap'}
                    </button>
                  </div>
                </div>

                {/* Thông tin chi tiết 24h */}
                <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 text-xs text-gray-400">
                  <div>
                    <span className="block font-medium text-gray-300">{data.volume}</span>
                    <span className='text-gray-500'>{t.rates?.volume || 'Khối lượng'}</span>
                  </div>
                  <div className='text-center'>
                    <span className="block font-medium text-green-400">
                      {typeof data.high24h === 'number' ? data.high24h.toFixed(4) : data.high24h}
                    </span>
                    <span className='text-gray-500'>{t.rates?.high24h || 'Cao (24h)'}</span>
                  </div>
                  <div className='text-right'>
                    <span className="block font-medium text-red-400">
                      {typeof data.low24h === 'number' ? data.low24h.toFixed(4) : data.low24h}
                    </span>
                    <span className='text-gray-500'>{t.rates?.low24h || 'Thấp (24h)'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-gray-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Đang tải dữ liệu tỷ giá...</p>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-1 mt-0.5">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-200 mb-1">
              {isLiveData ? 'StableFX Real-Time Rates' : 'Demo Mode'}
            </h4>
            <p className="text-sm text-blue-300">
              {isLiveData
                ? 'Rates are sourced from Circle StableFX with RFQ execution and on-chain settlement on Arc Network. Competitive pricing from multiple liquidity providers.'
                : 'Đang chạy ở demo mode. Để sử dụng tỷ giá thực, vui lòng cung cấp StableFX API key.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}