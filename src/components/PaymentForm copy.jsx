// src/components/PaymentForm.jsx (ĐÃ CẬP NHẬT HOÀN TOÀN CHO PERMIT2)

import React, { useState, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { isAddress } from 'viem';
import { Send, AlertCircle, CheckCircle, Loader, ExternalLink, User, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
// Đã loại bỏ import PERMIT2_ABI không cần thiết
import usePayment from '../hooks/usePayment';
import { CONTRACTS } from '../config/contracts'; // Import CONTRACTS để dùng địa chỉ token

// -------------------------------------------------------------------------------------------------
// CONFIG: SỬ DỤNG HẰNG SỐ CÓ SẴN
// -------------------------------------------------------------------------------------------------
// Địa chỉ USDC (hoặc token muốn thanh toán) trên mạng Arc Testnet. 
const PAY_TOKEN_ADDRESS = CONTRACTS.USDC;
const PAY_TOKEN_DECIMALS = 6;

// Danh sách tiền tệ được hỗ trợ để gửi
const SUPPORTED_CURRENCIES = ['USDC', 'USDT', 'DAI'];

// MOCK: Tỷ giá hối đoái cho mục đích hiển thị
const ESTIMATION_CURRENCIES = [
    { code: 'VND', rate: 25000 },
    { code: 'EUR', rate: 0.92 },
    { code: 'GBP', rate: 0.79 },
];
// -------------------------------------------------------------------------------------------------

export default function PaymentForm() {
    const { t } = useLanguage();
    const { address, isConnected } = useAccount();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [payToken, setPayToken] = useState(SUPPORTED_CURRENCIES[0]);
    const [note, setNote] = useState('');

    // SỬ DỤNG HOOK ĐÃ CẬP NHẬT (Hàm requestPayment hiện là Permit2)
    const {
        requestPayment,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash
    } = usePayment();

    // Lấy số dư của token thanh toán
    const { data: balanceData } = useBalance({
        address: address,
        token: PAY_TOKEN_ADDRESS,
        query: {
            enabled: isConnected && !!PAY_TOKEN_ADDRESS,
        },
    });

    const tokenBalance = balanceData?.formatted || '0.00';

    // -------------------------------------------------------------------------
    // LOGIC: Tính giá trị ước tính
    // -------------------------------------------------------------------------
    const estimatedValues = useMemo(() => {
        const inputAmount = Number(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            return [];
        }
        return ESTIMATION_CURRENCIES.map(fx => ({
            currency: fx.code,
            value: (inputAmount * fx.rate).toFixed(2),
        }));
    }, [amount]);

    // -------------------------------------------------------------------------
    // LOGIC: Xử lý Gửi Thanh toán (Gọi hàm đã được Permit2 hóa)
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
            // Gọi hàm thanh toán, hiện tại đã là Permit2 trong hook
            await requestPayment({
                payee: recipient,
                amount: amount,
                currency: payToken,
            });

        } catch (err) {
            // Lỗi đã được hiển thị qua hook, chỉ cần log
            console.error('Lỗi khi gửi giao dịch Permit2:', err);
        }
    };

    // -------------------------------------------------------------------------
    // TRẠNG THÁI NÚT GỬI & UI (Giữ nguyên)
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

                {/* Balance & Estimation */}
                {isConnected && (
                    <div className="flex justify-between text-sm mb-4 text-gray-400">
                        <span>{t.paymentForm?.balance || 'Số dư'}: <span className="text-white font-medium">{tokenBalance} {payToken}</span></span>

                        <span className="text-right">
                            {t.paymentForm?.estimatedValue || 'Ước tính'}:
                            {estimatedValues.map(v => (
                                <span key={v.currency} className="text-purple-300 font-medium ml-2">{v.value} {v.currency}</span>
                            ))}
                        </span>
                    </div>
                )}

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
                                {/* Hiển thị lỗi chi tiết hơn */}
                                {typeof error === 'string' ? `: ${error.split('\n')[0]}` : ''}
                            </p>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}