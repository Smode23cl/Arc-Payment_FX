// src/components/PaymentForm.jsx (ĐÃ CẬP NHẬT - SỬ DỤNG FX REGISTRY ON-CHAIN)

import React, { useState, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi';
import { isAddress, formatUnits } from 'viem';
import { Send, AlertCircle, CheckCircle, Loader, ExternalLink, User, DollarSign, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import usePayment from '../hooks/usePayment';
import { CONTRACTS } from '../config/contracts';

// -------------------------------------------------------------------------------------------------
// CONFIG
// -------------------------------------------------------------------------------------------------
const PAY_TOKEN_ADDRESS = CONTRACTS.USDC;
const PAY_TOKEN_DECIMALS = 6;
const SUPPORTED_CURRENCIES = ['USDC', 'EURC'];

// ⭐ ĐỊA CHỈ FX REGISTRY CONTRACT
const FX_REGISTRY_ADDRESS = '0xaf4aCA1644c19d04B251223104faC31B11d1aA51';

// ABI cho FX Registry (chỉ cần hàm getLatestPrice)
const FX_REGISTRY_ABI = [
    {
        "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
        "name": "getLatestPrice",
        "outputs": [{ "internalType": "int256", "name": "", "type": "int256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "pair", "type": "string" }],
        "name": "getDecimals",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Danh sách các cặp tiền tệ để hiển thị
const FX_PAIRS = [
    { code: 'VND', pair: 'USD/VND', label: 'VND (Vietnam Dong)' },
    { code: 'KRW', pair: 'USD/KRW', label: 'KRW (KRWo)' },
    { code: 'GBP', pair: 'USD/GBP', label: 'GBP (British Pound)' },
    { code: 'JPY', pair: 'USD/JPY', label: 'JPY (Japanese Yen)' },
    { code: 'CNY', pair: 'USD/CNY', label: 'CNY (Chinese Yuan)' },
];

// -------------------------------------------------------------------------------------------------
// COMPONENT
// -------------------------------------------------------------------------------------------------
export default function PaymentForm() {
    const { t } = useLanguage();
    const { address, isConnected } = useAccount();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [payToken, setPayToken] = useState(SUPPORTED_CURRENCIES[0]);
    const [note, setNote] = useState('');

    const {
        requestPayment,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash
    } = usePayment();

    const { data: balanceData } = useBalance({
        address: address,
        token: PAY_TOKEN_ADDRESS,
        query: {
            enabled: isConnected && !!PAY_TOKEN_ADDRESS,
        },
    });

    const tokenBalance = balanceData?.formatted || '0.00';

    // -------------------------------------------------------------------------
    // 🔥 ĐỌC TỶ GIÁ TỪ ON-CHAIN (FX REGISTRY)
    // -------------------------------------------------------------------------

    // Hook để đọc giá VND
    const { data: vndPrice, isLoading: vndLoading, refetch: refetchVND } = useReadContract({
        address: FX_REGISTRY_ADDRESS,
        abi: FX_REGISTRY_ABI,
        functionName: 'getLatestPrice',
        args: ['USDC/VNDC'],
        query: { enabled: true }
    });

    // Hook để đọc giá KRW
    const { data: KRWPrice, isLoading: KRWLoading, refetch: refetchKRW } = useReadContract({
        address: FX_REGISTRY_ADDRESS,
        abi: FX_REGISTRY_ABI,
        functionName: 'getLatestPrice',
        args: ['USDC/KRW'],
        query: { enabled: true }
    });

    // Hook để đọc giá GBP
    const { data: gbpPrice, isLoading: gbpLoading, refetch: refetchGBP } = useReadContract({
        address: FX_REGISTRY_ADDRESS,
        abi: FX_REGISTRY_ABI,
        functionName: 'getLatestPrice',
        args: ['USDC/GBP'],
        query: { enabled: true }
    });

    // Hook để đọc giá JPY
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

    // Hàm refresh tất cả giá
    const handleRefreshRates = () => {
        refetchVND();
        refetchKRW();
        refetchGBP();
        refetchJPY();
        refetchCNY();
    };

    // -------------------------------------------------------------------------
    // 🔥 TÍNH GIÁ TRỊ ƯỚC TÍNH TỪ ON-CHAIN DATA
    // -------------------------------------------------------------------------
    const estimatedValues = useMemo(() => {
        const inputAmount = Number(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            return [];
        }

        const results = [];

        // FX Registry trả về giá với 8 decimals (theo MockAggregator)
        const FX_DECIMALS = 8;

        // VND
        if (vndPrice && !vndLoading) {
            const rate = Number(formatUnits(vndPrice, FX_DECIMALS));
            results.push({
                currency: 'VNDC',
                value: (inputAmount * rate).toFixed(0), // VND không dùng số thập phân
                rate: rate.toFixed(2),
                loading: false
            });
        } else if (vndLoading) {
            results.push({ currency: 'VNDC', value: '---', rate: '---', loading: true });
        }

        // KRW
        if (KRWPrice && !KRWLoading) {
            const rate = Number(formatUnits(KRWPrice, FX_DECIMALS));
            results.push({
                currency: 'KRW',
                value: (inputAmount * rate).toFixed(2),
                rate: rate.toFixed(4),
                loading: false
            });
        } else if (KRWLoading) {
            results.push({ currency: 'KRW', value: '---', rate: '---', loading: true });
        }

        // GBP
        if (gbpPrice && !gbpLoading) {
            const rate = Number(formatUnits(gbpPrice, FX_DECIMALS));
            results.push({
                currency: 'GBP',
                value: (inputAmount * rate).toFixed(2),
                rate: rate.toFixed(4),
                loading: false
            });
        } else if (gbpLoading) {
            results.push({ currency: 'GBP', value: '---', rate: '---', loading: true });
        }

        // JPY
        if (jpyPrice && !jpyLoading) {
            const rate = Number(formatUnits(jpyPrice, FX_DECIMALS));
            results.push({
                currency: 'JPY',
                value: (inputAmount * rate).toFixed(0), // JPY không dùng số thập phân
                rate: rate.toFixed(2),
                loading: false
            });
        } else if (jpyLoading) {
            results.push({ currency: 'JPY', value: '---', rate: '---', loading: true });
        }

        //CNY
        if (cnyPrice && !cnyLoading) {
            const rate = Number(formatUnits(cnyPrice, FX_DECIMALS));
            results.push({
                currency: 'CNY',
                value: (inputAmount * rate).toFixed(0),
                rate: rate.toFixed(2),
                loading: false
            });
        } else if (cnyLoading) {
            results.push({ currency: 'CNY', value: '---', rate: '---', loading: true });
        }

        return results;
    }, [amount, vndPrice, KRWPrice, gbpPrice, jpyPrice, cnyPrice, vndLoading, KRWLoading, gbpLoading, jpyLoading, cnyLoading]);

    // -------------------------------------------------------------------------
    // XỬ LÝ GỬI THANH TOÁN
    // -------------------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            alert(t.paymentForm?.errorConnect || 'Vui lòng kết nối ví');
            return;
        }

        if (!isAddress(recipient)) {
            alert(t.paymentForm?.errorRecipient || 'Vui lòng nhập địa chỉ người nhận hợp lệ');
            return;
        }

        const inputAmount = Number(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            alert(t.paymentForm?.errorAmount || 'Số tiền không hợp lệ');
            return;
        }

        try {
            await requestPayment({
                payee: recipient,
                amount: amount,
                currency: payToken,
            });
        } catch (err) {
            console.error('Lỗi khi gửi giao dịch Permit2:', err);
        }
    };

    // -------------------------------------------------------------------------
    // TRẠNG THÁI NÚT GỬI & UI
    // -------------------------------------------------------------------------
    let buttonText = t.paymentForm?.buttonSend || 'Gửi thanh toán';
    let buttonIcon = <Send className="w-5 h-5" />;
    let buttonDisabled = isPending || isConfirming || !isConnected || !isAddress(recipient) || Number(amount) <= 0;

    if (!isConnected) {
        buttonText = t.paymentForm?.buttonConnect || 'Kết nối Ví';
        buttonIcon = <User className="w-5 h-5" />;
        buttonDisabled = false;
    } else if (isPending) {
        buttonText = t.paymentForm?.buttonSending || 'Đang gửi...';
        buttonIcon = <Loader className="w-5 h-5 animate-spin" />;
    } else if (isConfirming) {
        buttonText = t.paymentForm?.buttonConfirming || 'Đang xác nhận...';
        buttonIcon = <Loader className="w-5 h-5 animate-spin" />;
    } else if (isSuccess) {
        buttonText = t.paymentForm?.buttonSuccess || 'Thành công!';
        buttonIcon = <CheckCircle className="w-5 h-5" />;
    }

    return (
        <div className="max-w-xl mx-auto p-6 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">
                {t.paymentForm?.title || 'Gửi Thanh Toán'}
            </h2>
            <form onSubmit={handleSubmit}>
                {/* Input: Recipient Address */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t.paymentForm?.recipientLabel || 'Địa chỉ Người Nhận (Payee)'}
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Input: Amount & Currency */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {t.paymentForm?.amountLabel || 'Số Tiền'}
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100.00"
                            min="0"
                            step="any"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-gray-400 text-sm font-semibold mb-2">
                            {t.paymentForm?.currencyLabel || 'Tiền tệ'}
                        </label>
                        <select
                            value={payToken}
                            onChange={(e) => setPayToken(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                        >
                            {SUPPORTED_CURRENCIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Balance Display */}
                {isConnected && (
                    <div className="flex justify-between text-sm mb-4 text-gray-400">
                        <span>
                            {t.paymentForm?.balance || 'Số dư'}:
                            <span className="text-white font-medium ml-1">{tokenBalance} {payToken}</span>
                        </span>
                    </div>
                )}

                {/* 🔥 FX RATES FROM ON-CHAIN - Estimated Values */}
                <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {t.paymentForm?.estimatedValue || 'Giá trị ước tính'} (On-chain FX)
                        </h4>
                        <button
                            type="button"
                            onClick={handleRefreshRates}
                            className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Refresh rates"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Hiển thị khi chưa nhập số tiền */}
                    {(!amount || Number(amount) <= 0) ? (
                        <div className="text-center py-3 text-gray-500 text-sm">
                            {t.paymentForm.estimatedValue}
                        </div>
                    ) : estimatedValues.length === 0 ? (
                        <div className="text-center py-3 text-yellow-400 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Không thể tải tỷ giá từ contract
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {estimatedValues.map(item => (
                                <div key={item.currency} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">{item.currency}:</span>
                                    {item.loading ? (
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Loader className="w-3 h-3 animate-spin" /> Loading...
                                        </span>
                                    ) : (
                                        <div className="text-right">
                                            <span className="text-purple-300 font-medium">{item.value}</span>
                                            <span className="text-gray-500 text-xs ml-2">(Rate: {item.rate})</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
{/* 
                    <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
                        💡 Tỷ giá được lấy từ FX Registry: {FX_REGISTRY_ADDRESS.slice(0, 6)}...{FX_REGISTRY_ADDRESS.slice(-4)}
                    </p> */}

                    {/* Debug info - hiển thị raw data */}
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2 text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-400">Debug Info</summary>
                            <div className="mt-1 p-2 bg-gray-900 rounded">
                                <div>VND: {vndPrice?.toString() || 'null'} {vndLoading && '(loading)'}</div>
                                <div>KRW: {KRWPrice?.toString() || 'null'} {KRWLoading && '(loading)'}</div>
                                <div>GBP: {gbpPrice?.toString() || 'null'} {gbpLoading && '(loading)'}</div>
                                <div>JPY: {jpyPrice?.toString() || 'null'} {jpyLoading && '(loading)'}</div>
                                <div>CNY: {cnyPrice?.toString() || 'null'} {cnyLoading && '(loading)'}</div>
                            </div>
                        </details>
                    )}
                </div>

                {/* Input: Note (optional) */}
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-semibold mb-2">
                        {t.paymentForm?.noteLabel || 'Ghi chú (Tùy chọn)'}
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.paymentForm?.notePlaceholder || 'Thanh toán hóa đơn'}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type={isConnected ? "submit" : "button"}
                    onClick={!isConnected ? null : undefined}
                    disabled={buttonDisabled}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50 text-lg"
                >
                    {buttonIcon} {buttonText}
                </button>

                {/* Transaction Status & Error */}
                {hash && (
                    <div className="mt-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
                        <h4 className="font-semibold text-white mb-2">
                            {t.paymentForm?.transactionStatus || 'Trạng thái giao dịch'}
                        </h4>
                        <p className="text-sm text-gray-400 break-all">
                            Hash: <a
                                href={`https://testnet.arcscan.app/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-1"
                            >
                                {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </p>
                        {isPending && (
                            <p className="text-sm text-yellow-300 flex items-center gap-2 mt-1">
                                <Loader className="w-4 h-4 animate-spin" />
                                {t.paymentForm?.buttonSending || 'Đang gửi...'}
                            </p>
                        )}
                        {isConfirming && (
                            <p className="text-sm text-yellow-300 flex items-center gap-2 mt-1">
                                <Loader className="w-4 h-4 animate-spin" />
                                {t.paymentForm?.buttonConfirming || 'Đang chờ xác nhận...'}
                            </p>
                        )}
                        {isSuccess && (
                            <p className="text-sm text-green-300 font-semibold flex items-center gap-2 mt-1">
                                <CheckCircle className="w-4 h-4" />
                                {t.paymentForm?.confirmed || 'Giao dịch đã được xác nhận!'}
                            </p>
                        )}
                        {error && (
                            <p className="text-sm text-red-300 font-semibold flex items-center gap-2 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {t.paymentForm?.confirmationError || 'Lỗi giao dịch!'}
                                {typeof error === 'string' ? `: ${error.split('\n')[0]}` : ''}
                            </p>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}