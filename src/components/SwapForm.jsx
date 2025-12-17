// src/components/SwapForm.jsx
import React, { useState, useEffect } from 'react';
import { ArrowDown, X, RefreshCw, Send, ArrowLeftRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useLanguage } from '../contexts/LanguageContext';

// --- CONFIG ON-CHAIN ---
const FX_REGISTRY_ADDRESS = '0xaf4aCA1644c19d04B251223104faC31B11d1aA51';
const STABLEFX_ROUTER_ADDRESS = '0x539e3177dbd4c63Af6c1A1638784D9CacdEb4Ad5'; 
const FX_DECIMALS = 8;

const FX_REGISTRY_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
    "name": "getLatestPrice",
    "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenIn", "type": "address" },
      { "internalType": "address", "name": "tokenOut", "type": "address" },
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "minAmountOut", "type": "uint256" }
    ],
    "name": "swap",
    "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
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
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const TOKEN_ADDRESSES = {
  USDC: '0x3600000000000000000000000000000000000000',
  VNDC: '0xF2625B91c67A011b9F5a4fee59814EC0dE23A6d7',
  EUR: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  GBP: '0xFE625065067F13d93D24f357615C680a7660e5db',
  JPY: '0x0d4d5251aFf1facaC43Af61F78A8f339D28808f7',
  CNY:'0x3d75AA4adeb864a72AE3bc3d3749059348413d70',
};

const TOKENS_CONFIG = {
  USDC: { name: 'USD Coin', decimals: 6 },
  VNDC: { name: 'Vietnamese Dong', decimals: 8 },
  EUR: { name: 'Euro', decimals: 8 },
  GBP: { name: 'British Pound', decimals: 8 },
  JPY: { name: 'Japanese Yen', decimals: 8 },
  CNY: { name: 'Chinese Yuan', decimals: 8 },
};

const getPairName = (tokenIn, tokenOut) => {
  if (tokenIn === 'USDC' || tokenOut === 'USDC') {
    return tokenIn === 'USDC' ? `USDC/${tokenOut}` : `USDC/${tokenIn}`;
  }
  return null;
};

export default function SwapForm({ t: propT, onCancel }) {
  const { t } = useLanguage();

  const { address, isConnected } = useAccount();
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('VNDC');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false);

  const availableTokens = Object.keys(TOKENS_CONFIG);
  const fxPair = getPairName(tokenIn, tokenOut);

  // 1. Đọc dữ liệu on-chain (Đã tối ưu để tránh lỗi 429)
  const { data: fxRate, isLoading: rateLoading, refetch: refetchRate } = useReadContract({
    address: FX_REGISTRY_ADDRESS,
    abi: FX_REGISTRY_ABI,
    functionName: 'getLatestPrice',
    args: [fxPair],
    query: { 
      enabled: !!fxPair && !showSuccessUI, 
      refetchInterval: 300000, // Tăng lên 30s để giảm tải RPC
      staleTime: 150000 
    }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESSES[tokenIn],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, STABLEFX_ROUTER_ADDRESS],
    query: { enabled: !!address && !showSuccessUI }
  });

  const { data: balanceIn } = useReadContract({
    address: TOKEN_ADDRESSES[tokenIn],
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && !showSuccessUI }
  });

  // 2. Giao dịch
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSwap, data: swapHash } = useWriteContract();

  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isSwapping, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

  const currentRate = fxRate ? Number(formatUnits(fxRate, FX_DECIMALS)) : 0;
  const formattedBalance = balanceIn ? formatUnits(balanceIn, TOKENS_CONFIG[tokenIn].decimals) : '0';

  // Tính toán Amount Out tự động
  useEffect(() => {
    if (currentRate > 0 && amountIn > 0) {
      const out = tokenIn === 'USDC' ? amountIn * currentRate : amountIn / currentRate;
      setAmountOut((out * (1 - slippage / 100)).toFixed(6));
    } else {
      setAmountOut('');
    }
  }, [amountIn, currentRate, tokenIn, slippage]);

  // Hàm gọi lệnh Swap thực tế
  const executeSwapCall = () => {
    const amountInWei = parseUnits(amountIn, TOKENS_CONFIG[tokenIn].decimals);
    const minAmountOutWei = parseUnits(amountOut, TOKENS_CONFIG[tokenOut].decimals);

    writeSwap({
      address: STABLEFX_ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'swap',
      args: [TOKEN_ADDRESSES[tokenIn], TOKEN_ADDRESSES[tokenOut], amountInWei, minAmountOutWei]
    });
  };

  // Xử lý nộp form
  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected || !amountIn) return;

    const amountInWei = parseUnits(amountIn, TOKENS_CONFIG[tokenIn].decimals);
    // Kiểm tra hạn mức trước khi Swap
    if (!allowance || allowance < amountInWei) {
      writeApprove({
        address: TOKEN_ADDRESSES[tokenIn],
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [STABLEFX_ROUTER_ADDRESS, amountInWei]
      });
    } else {
      executeSwapCall();
    }
  };

  // Tự động Swap sau khi duyệt thành công
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance().then(() => executeSwapCall());
    }
  }, [approveSuccess]);

  // Hiển thị thông báo khi Swap xong và reset form
  useEffect(() => {
    if (swapSuccess) {
      setShowSuccessUI(true);
      setAmountIn('');
      setAmountOut('');
    }
  }, [swapSuccess]);

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  return (
    <div className="max-w-lg mx-auto relative">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-gray-700">
        
        {/* SUCCESS OVERLAY - Thay thế cho Alert */}
        {showSuccessUI && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/95 rounded-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">{t.swap?.swapsuccess}</h3>
              <p className="text-gray-400 mb-6 text-sm">{t.swap?.notetoken}</p>
              <div className="flex flex-col gap-3">
                {swapHash && (
                  <a href={`https://testnet.arcscan.app/tx/${swapHash}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-purple-400 text-sm hover:underline">
                    {t.swap?.explorer} <ExternalLink size={14} />
                  </a>
                )}
                <button onClick={() => setShowSuccessUI(false)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all">Đóng</button>
              </div>
            </div>
          </div>
        )}

        <div className='flex justify-between items-center border-b border-gray-700 pb-4 mb-6'>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className='w-6 h-6 text-purple-400' /> {t.swap?.title}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"><X /></button>
        </div>

        {fxPair && (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 mb-4 flex justify-between items-center">
            <div className="text-purple-400 text-sm">{currentRate > 0 ? `1 ${tokenIn} = ${currentRate.toFixed(4)} ${tokenOut}` : 'Đang tải giá...'}</div>
            <button type="button" onClick={() => refetchRate()} className="text-purple-400"><RefreshCw size={16} className={rateLoading ? 'animate-spin' : ''} /></button>
          </div>
        )}

        <form onSubmit={handleSwapSubmit} className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{t.swap?.from||'Bạn trả'}</span>
              <span>{t.swap?.balance}: {parseFloat(formattedBalance).toFixed(2)} {tokenIn}</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="number" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent text-white text-3xl font-bold outline-none" />
              <select value={tokenIn} onChange={(e) => setTokenIn(e.target.value)} className="bg-purple-600 text-white rounded-lg px-2 py-1 font-bold outline-none">
                {availableTokens.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-2">
            <button type='button' onClick={handleFlip} className="p-2 bg-gray-600 hover:bg-purple-600 text-white rounded-full border-4 border-gray-800 z-10 transition-colors"><ArrowDown size={20} /></button>
          </div>

          <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <label className="text-xs text-gray-400 mb-2 block">{t.swap?.to}</label>
            <div className="flex items-center gap-3">
              <input type="text" value={amountOut} readOnly placeholder="0.00" className="flex-1 bg-transparent text-green-400 text-3xl font-bold outline-none" />
              <select value={tokenOut} onChange={(e) => setTokenOut(e.target.value)} className="bg-gray-600 text-white rounded-lg px-2 py-1 font-bold outline-none">
                {availableTokens.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400">
            <button type="button" onClick={() => setShowSlippageSettings(!showSlippageSettings)}>{t.swap?.Depreciation}: {slippage}%</button>
            {showSlippageSettings && (
              <div className="flex gap-1">
                {[0.1, 0.5, 1.0].map(v => (
                  <button key={v} type="button" onClick={() => {setSlippage(v); setShowSlippageSettings(false);}} className={`px-2 py-1 rounded ${slippage === v ? 'bg-purple-600 text-white' : 'bg-gray-600'}`}>{v}%</button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isConnected || !amountOut || isApproving || isSwapping}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/30"
          >
            {isApproving ? <><RefreshCw className="animate-spin" /> {t.swap?.approving}</> :
             isSwapping ? <><RefreshCw className="animate-spin" /> {t.swap?.procss}</> :
             <><Send size={20} /> {t.swap?.swapButton}</>}
          </button>
        </form>
      </div>
    </div>
  );
}