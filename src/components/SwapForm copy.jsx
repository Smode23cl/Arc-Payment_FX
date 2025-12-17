// src/components/SwapForm.jsx (TÍCH HỢP ON-CHAIN FX RATES)

import React, { useState, useEffect } from 'react';
import { ArrowDown, X, RefreshCw, Send, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

// -------------------------------------------------------------------------------------------------
// CONFIG ON-CHAIN
// -------------------------------------------------------------------------------------------------
const FX_REGISTRY_ADDRESS = '0xaf4aCA1644c19d04B251223104faC31B11d1aA51';
const FX_DECIMALS = 8;

// ABI cho FX Registry
const FX_REGISTRY_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
    "name": "getLatestPrice",
    "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Token addresses (cần cập nhật địa chỉ thực tế của các token)
const TOKEN_ADDRESSES = {
  USDC: '0x3600000000000000000000000000000000000000', // Địa chỉ USDC contract
  VNDC: '0xF2625B91c67A011b9F5a4fee59814EC0dE23A6d7', // Địa chỉ VNDC contract
  KRW: '0x2b0218dA506b186Ef0f4E4D810Fe046aA386bCb8', // Địa chỉ EUR contract
  GBP: '0xFE625065067F13d93D24f357615C680a7660e5db', // Địa chỉ GBP contract
  JPY: '0x0d4d5251aFf1facaC43Af61F78A8f339D28808f7', // Địa chỉ JPY contract
};

// ERC20 ABI cơ bản cho approve và transfer
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Cấu hình tokens với logo
const TOKENS_CONFIG = {
  USDC: { name: 'USD Coin', decimals: 6, logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  VNDC: { name: 'Vietnamese Dong', decimals: 6, logo: 'https://flagcdn.com/w40/vn.png' },
  EUR: { name: 'Euro', decimals: 6, logo: 'https://flagcdn.com/w40/eu.png' },
  GBP: { name: 'British Pound', decimals: 6, logo: 'https://flagcdn.com/w40/gb.png' },
  JPY: { name: 'Japanese Yen', decimals: 6, logo: 'https://flagcdn.com/w40/jp.png' },
};

// Map cặp token sang cặp FX Registry
const getPairName = (tokenIn, tokenOut) => {
  if (tokenIn === 'USDC') return `USDC/${tokenOut}`;
  if (tokenOut === 'USDC') return `USDC/${tokenIn}`;
  // Nếu không có USDC, cần convert qua USDC trung gian
  return null;
};

export default function SwapForm({ t, defaultPair, onCancel }) {
  const { address, isConnected } = useAccount();
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('VNDC');
  const [slippage, setSlippage] = useState(0.5); // 0.5% slippage mặc định
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  const availableTokens = Object.keys(TOKENS_CONFIG);

  // Xác định cặp FX cần query
  const fxPair = getPairName(tokenIn, tokenOut);

  // 1. ĐỌC TỶ GIÁ TỪ CONTRACT
  const { data: fxRate, isLoading: rateLoading, refetch: refetchRate } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: [fxPair],
    query: { 
      enabled: !!fxPair && isConnected,
      refetchInterval: 10000 // Tự động refresh mỗi 10s
    }
  });

  // 2. ĐỌC BALANCE CỦA USER
  const { data: balanceIn } = useReadContract({
    address: TOKEN_ADDRESSES[tokenIn],
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && !!TOKEN_ADDRESSES[tokenIn] }
  });

  // 3. WRITE CONTRACT HOOKS
  const { writeContract: approveToken, data: approveHash } = useWriteContract();
  const { writeContract: executeSwap, data: swapHash } = useWriteContract();

  // 4. WAIT FOR TRANSACTIONS
  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isSwapping, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

  // Parse FX rate
  const currentRate = fxRate ? Number(formatUnits(fxRate, FX_DECIMALS)) : 0;

  // Set default pair nếu có
  useEffect(() => {
    if (defaultPair) {
      const [inToken, outToken] = defaultPair.split('/');
      if (availableTokens.includes(inToken)) setTokenIn(inToken);
      if (availableTokens.includes(outToken)) setTokenOut(outToken);
    }
  }, [defaultPair]);

  // Tính toán amount out dựa trên FX rate
  useEffect(() => {
    if (!amountIn || isNaN(amountIn) || !currentRate) {
      setAmountOut('');
      return;
    }

    const inputAmount = parseFloat(amountIn);
    let calculatedOut = 0;

    if (tokenIn === 'USDC') {
      // USDC -> Other: nhân với rate
      calculatedOut = inputAmount * currentRate;
    } else if (tokenOut === 'USDC') {
      // Other -> USDC: chia cho rate
      calculatedOut = inputAmount / currentRate;
    } else {
      // Cần convert qua USDC trung gian (chưa implement)
      calculatedOut = 0;
    }

    // Apply slippage
    const withSlippage = calculatedOut * (1 - slippage / 100);
    setAmountOut(withSlippage.toFixed(6));
  }, [amountIn, currentRate, tokenIn, tokenOut, slippage]);

  // Format balance
  const formattedBalance = balanceIn 
    ? formatUnits(balanceIn, TOKENS_CONFIG[tokenIn].decimals)
    : '0';

  const handleMaxAmount = () => {
    if (balanceIn) {
      const maxAmount = formatUnits(balanceIn, TOKENS_CONFIG[tokenIn].decimals);
      setAmountIn(maxAmount);
    }
  };

  const handleFlip = () => {
    const tempToken = tokenIn;
    const tempAmount = amountIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
    setAmountOut(tempAmount);
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert(t.connectWallet || 'Vui lòng kết nối ví!');
      return;
    }

    if (!amountIn || !amountOut) {
      alert(t.enterAmount || 'Vui lòng nhập số lượng!');
      return;
    }

    try {
      const amountInWei = parseUnits(amountIn, TOKENS_CONFIG[tokenIn].decimals);
      
      // Bước 1: Approve token (nếu cần)
      console.log('Approving token...');
      await approveToken({
        address: TOKEN_ADDRESSES[tokenIn],
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TOKEN_ADDRESSES[tokenOut], amountInWei] // Hoặc router address
      });

      // Bước 2: Execute swap (cần có swap contract/router)
      // Đây là ví dụ đơn giản, thực tế cần có swap router contract
      console.log('Executing swap...');
      // await executeSwap({...});
      
    } catch (error) {
      console.error('Swap error:', error);
      alert(t.swapError || 'Lỗi khi swap! Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    if (swapSuccess) {
      alert(t.swapSuccess || 'Swap thành công!');
      setAmountIn('');
      setAmountOut('');
    }
  }, [swapSuccess]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-gray-700">
        
        {/* Header */}
        <div className='flex justify-between items-center border-b border-gray-700 pb-4 mb-6'>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className='w-6 h-6 text-purple-400' /> {t.title || 'Swap'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
            title={t.backToPayment || 'Quay lại'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FX Rate Display */}
        {currentRate > 0 && (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-purple-400 text-sm">
                1 {tokenIn} = {currentRate.toFixed(6)} {tokenOut}
              </div>
            </div>
            <button
              onClick={() => refetchRate()}
              disabled={rateLoading}
              className="text-purple-400 hover:text-purple-300 p-1"
              title="Refresh rate"
            >
              <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Warning nếu chưa kết nối ví */}
        {!isConnected && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-yellow-300">
              {t.connectWalletWarning || 'Vui lòng kết nối ví để swap'}
            </span>
          </div>
        )}

        <form onSubmit={handleSwap} className="space-y-4">
          
          {/* Token In */}
          <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">
                {t.payLabel || 'Bạn trả'}
              </label>
              <div className="text-xs text-gray-400">
                {t.amount || 'Số dư'}: {parseFloat(formattedBalance).toFixed(4)} {tokenIn}
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="ml-2 text-purple-400 hover:text-purple-300 font-semibold"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className="flex-1 bg-transparent text-white text-3xl font-bold focus:outline-none placeholder-gray-500"
              />
              <select
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
                className="bg-purple-600 text-white rounded-lg px-3 py-2 font-bold cursor-pointer flex items-center gap-2"
              >
                {availableTokens.map(token => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2">
            <button
              type='button'
              onClick={handleFlip}
              className="p-2 bg-gray-600 hover:bg-purple-600 text-white rounded-full border-4 border-gray-800 transition-colors shadow-lg z-10"
              title={t.flip || 'Đảo cặp'}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* Token Out */}
          <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.receiveLabel || 'Bạn nhận'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amountOut}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-green-400 text-3xl font-bold focus:outline-none placeholder-gray-500"
              />
              <select
                value={tokenOut}
                onChange={(e) => setTokenOut(e.target.value)}
                className="bg-gray-600 text-white rounded-lg px-3 py-2 font-bold cursor-pointer"
              >
                {availableTokens.map(token => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slippage Settings */}
          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t.slippage || 'Slippage'}: {slippage}%
            </button>
            {showSlippageSettings && (
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0, 3.0].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      slippage === value 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Impact Warning */}
          {amountOut && (
            <div className="text-xs text-gray-400 flex justify-between">
              <span>{t.minimumReceived || 'Số lượng tối thiểu'}:</span>
              <span className="text-white font-medium">
                {(parseFloat(amountOut) * 0.995).toFixed(6)} {tokenOut}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isConnected || !amountOut || isApproving || isSwapping || rateLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50 text-xl mt-6"
          >
            {isApproving ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                {t.approving || 'Đang phê duyệt...'}
              </>
            ) : isSwapping ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                {t.swapping || 'Đang swap...'}
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                {t.swapButton || 'Swap ngay'}
              </>
            )}
          </button>
        </form>

        {/* Info Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            💡 {t.swapInfo || 'Tỷ giá được lấy trực tiếp từ FX Registry on-chain'}
          </p>
        </div>
      </div>
    </div>
  );
}