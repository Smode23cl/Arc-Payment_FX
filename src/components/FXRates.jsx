import React, { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, RefreshCw, Info, ArrowLeftRight, Zap, Loader } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// -------------------------------------------------------------------------------------------------
// CONFIG ON-CHAIN
// -------------------------------------------------------------------------------------------------
// ⭐ ĐỊA CHỈ FX REGISTRY CONTRACT (Sử dụng địa chỉ từ PaymentForm.jsx)
const FX_REGISTRY_ADDRESS = '0xaf4aCA1644c19d04B251223104faC31B11d1aA51';
const FX_DECIMALS = 8; // Theo quy ước của MockAggregator

// ABI cho FX Registry (chỉ cần hàm getLatestPrice)
const FX_REGISTRY_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
    "name": "getLatestPrice",
    "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Danh sách các cặp tiền tệ mà Registry đang quản lý
const FX_PAIRS_CONFIG = [
  { code: 'VND', pair: 'USDC/VNDC', flag: 'https://flagcdn.com/w40/vn.png', name: 'Vietnamese Dong' },
  { code: 'KRW', pair: 'USDC/KRW', flag: 'https://flagcdn.com/w40/kr.png', name: 'Korean Won' },
  { code: 'GBP', pair: 'USDC/GBP', flag: 'https://flagcdn.com/w40/gb.png', name: 'British Pound' },
  { code: 'JPY', pair: 'USDC/JPY', flag: 'https://flagcdn.com/w40/jp.png', name: 'Japanese Yen' },
  { code: 'CNY', pair: 'USDC/CNY', flag: 'https://flagcdn.com/w40/cn.png', name: 'Chinese Yen' },
];

// -------------------------------------------------------------------------------------------------
// Component helper cho Sparkline
// -------------------------------------------------------------------------------------------------
const Sparkline = ({ isPositive }) => {
  return (
    <div className="w-16 h-8 flex items-end justify-center overflow-hidden">
      <div className="w-full h-full relative">
        <div className={`absolute bottom-0 left-0 w-1/4 h-2 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-50`}></div>
        <div className={`absolute bottom-0 left-1/4 w-1/4 h-5 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-75`}></div>
        <div className={`absolute bottom-0 left-2/4 w-1/4 h-3 ${isPositive ? 'bg-green-600' : 'bg-red-600'} opacity-50`}></div>
        <div className={`absolute bottom-0 left-3/4 w-1/4 h-6 ${isPositive ? 'bg-green-600' : 'bg-red-600'}`}></div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------------------------
// Component chính
// -------------------------------------------------------------------------------------------------
export default function FXRates({ t: propT, onSwapClick, fullWidth = false }) {
  const contextData = useLanguage();
  const t = propT || contextData?.t;

  const [selectedPair, setSelectedPair] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mockChange, setMockChange] = useState({});

  // 🔥 1. ĐỌC DỮ LIỆU TỪ ON-CHAIN CHO TỪNG CẶP (Sử dụng useReadContract riêng lẻ)
  const { data: vndPrice, isLoading: vndLoading, refetch: refetchVND } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: ['USDC/VNDC'],
    query: { enabled: true }
  });

  const { data: KRWPrice, isLoading: KRWLoading, refetch: refetchKRW } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: ['USDC/KRW'],
    query: { enabled: true }
  });

  const { data: gbpPrice, isLoading: gbpLoading, refetch: refetchGBP } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: ['USDC/GBP'],
    query: { enabled: true }
  });

  const { data: jpyPrice, isLoading: jpyLoading, refetch: refetchJPY } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: ['USDC/JPY'],
    query: { enabled: true }
  });

  const { data: cnyPrice, isLoading: cnyLoading, refetch: refetchCNY } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: ['USDC/CNY'],
    query: { enabled: true }
  });

  // Tổng hợp trạng thái loading
  const isPricesLoading = vndLoading || KRWLoading || gbpLoading || jpyLoading || cnyLoading;

  // LOG: Kiểm tra dữ liệu thô từ contract
  useEffect(() => {
    console.log("FXRates: Raw Prices from Contract:");
    console.log("  -> USDC/VNDC:", vndPrice?.toString() || 'N/A', "Loading:", vndLoading);
    console.log("  -> USDC/KRW:", KRWPrice?.toString() || 'N/A', "Loading:", KRWLoading);
    console.log("  -> USDC/GBP:", gbpPrice?.toString() || 'N/A', "Loading:", gbpLoading);
    console.log("  -> USDC/JPY:", jpyPrice?.toString() || 'N/A', "Loading:", jpyLoading);
    console.log("  -> USDC/CNY:", cnyPrice?.toString() || 'N/A', "Loading:", cnyLoading);
  }, [vndPrice, KRWPrice, gbpPrice, jpyPrice, cnyPrice, vndLoading, KRWLoading, gbpLoading, jpyLoading, cnyLoading]);

  // Khởi tạo mockChange khi có dữ liệu
  useEffect(() => {
    if (!isPricesLoading && (vndPrice || KRWPrice || gbpPrice || jpyPrice || cnyPrice)) {
      const initialChange = FX_PAIRS_CONFIG.reduce((acc, config) => {
        const changeValue = (Math.random() * 0.002 - 0.001);
        acc[config.pair] = changeValue > 0
          ? `+${(changeValue * 100).toFixed(2)}%`
          : `${(changeValue * 100).toFixed(2)}%`;
        return acc;
      }, {});
      setMockChange(initialChange);
    }
  }, [vndPrice, KRWPrice, gbpPrice, jpyPrice, cnyPrice, isPricesLoading]);

  // 🔥 2. XỬ LÝ DỮ LIỆU ĐỌC ĐƯỢC
  const rates = useMemo(() => {
    if (isPricesLoading) return {};

    const transformedRates = {};

    // Map dữ liệu từ các hook riêng lẻ
    const pricesMap = {
      'USDC/VNDC': vndPrice,
      'USDC/KRW': KRWPrice,
      'USDC/GBP': gbpPrice,
      'USDC/JPY': jpyPrice,
      'USDC/CNY': cnyPrice
    };

    FX_PAIRS_CONFIG.forEach((config) => {
      const rawPrice = pricesMap[config.pair];

      // Kiểm tra xem việc đọc contract có bị lỗi không
      if (!rawPrice || rawPrice === undefined) {
        transformedRates[config.pair] = {
          rate: t.rates?.error || 'N/A',
          change: t.rates?.error || 'N/A',
          volume: t.rates?.na || '---',
          high24h: t.rates?.na || '---',
          low24h: t.rates?.na || '---',
          loading: false,
          error: true,
          flag: config.flag,
          name: config.name
        };
        console.error(`FXRates: Failed to process data for ${config.pair}. Raw result: ${rawPrice?.toString() || 'undefined'}`);
        return;
      }

      const currentRate = Number(formatUnits(rawPrice, FX_DECIMALS));
      const changeString = mockChange[config.pair] || '+0.00%';
      const isPositive = changeString.startsWith('+');

      // Sử dụng giá hiện tại cho High/Low 24h vì không có dữ liệu lịch sử on-chain
      transformedRates[config.pair] = {
        rate: currentRate,
        change: changeString,
        volume: '2.5M', // Mock Volume
        high24h: currentRate * (1 + (isPositive ? 0.001 : 0)), // Mock High
        low24h: currentRate * (1 - (isPositive ? 0 : 0.001)), // Mock Low
        loading: false,
        isPositive: isPositive,
        flag: config.flag,
        name: config.name
      };
    });

    // LOG: Kiểm tra dữ liệu sau khi xử lý
    console.log("FXRates: Final Rates Object:", transformedRates);

    return transformedRates;
  }, [vndPrice, KRWPrice, gbpPrice, jpyPrice, isPricesLoading, mockChange, t]);

  // Xử lý refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Fetch lại dữ liệu từ contract cho tất cả các cặp
    await Promise.all([
      refetchVND(),
      refetchKRW(),
      refetchGBP(),
      refetchJPY(),
      refetchCNY()
    ]);

    // Tái tạo mockChange
    const newMockChange = FX_PAIRS_CONFIG.reduce((acc, config) => {
      const changeValue = (Math.random() * 0.002 - 0.001);
      acc[config.pair] = changeValue > 0
        ? `+${(changeValue * 100).toFixed(2)}%`
        : `${(changeValue * 100).toFixed(2)}%`;
      return acc;
    }, {});
    setMockChange(newMockChange);

    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isLiveData = Object.keys(rates).length > 0 && !Object.values(rates).some(r => r.error);
  const lastUpdate = new Date();

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
              {isLiveData ? 'On-chain FX Registry' : 'Đang tải...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {t.rates?.lastUpdate || 'Cập nhật'}: {lastUpdate.toLocaleTimeString('vi-VN')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isPricesLoading}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 disabled:text-gray-600"
            title={t.rates?.refresh || 'Làm mới'}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing || isPricesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rates Grid */}
      {(isPricesLoading || Object.keys(rates).length === 0) ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-12 h-12 text-gray-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Đang tải dữ liệu on-chain...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(rates).map((pair) => {
            const data = rates[pair];
            const isPositive = data.isPositive;
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
                  {/* Tên cặp tiền với cờ */}
                  <div className="flex items-center gap-2">
                    <img
                      src={data.flag}
                      alt={`${data.name} flag`}
                      className="w-8 h-6 object-cover rounded shadow-sm"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">{pair}</h3>
                      <p className="text-xs text-gray-400">{data.name}</p>
                    </div>
                  </div>
                  {/* Giá trị thay đổi */}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${changeColor} ${changeBg}`}>
                    {data.change}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-extrabold text-purple-400 leading-none mb-1">
                      {typeof data.rate === 'number'
                        ? data.rate.toFixed(pair === 'USDC/VNDC' || pair === 'USDC/JPY' ? 0 : 4)
                        : data.rate}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t.rates?.currentRate || 'Giá hiện tại'}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Sparkline isPositive={isPositive} />
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
      )}

      {/* Info banner */}
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-1 mt-0.5">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-200 mb-1">
              On-chain FX Registry Data
            </h4>
            <p className="text-sm text-blue-300">
              {t.rates.liveNote}              <br />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}