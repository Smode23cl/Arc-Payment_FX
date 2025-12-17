// src/wagmiConfig.js (FIXED: Sửa lỗi ReferenceError: process is not defined)

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { arcTestnet, allChains } from './config/chains';

// ****************************************************
// CẤU HÌNH WAGMI VÀ RAINBOWKIT
// ****************************************************

// Sử dụng import.meta.env để truy cập biến môi trường (theo chuẩn Vite)
// Đảm bảo Project ID của bạn được lưu trong biến VITE_WALLETCONNECT_PROJECT_ID
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '67f7f3cfa391f81c7374a000dfacc04e';

export const config = getDefaultConfig({
    appName: 'Arc FX Payment',

    // SỬ DỤNG BIẾN ĐÃ ĐỊNH NGHĨA TRƯỚC ĐÓ
    projectId: walletConnectProjectId,

    // Định nghĩa các mạng lưới mà ứng dụng hỗ trợ
    chains: allChains,

    // Định nghĩa cách các chain này được truy cập
    transports: {
        [arcTestnet.id]: http(),
    },
});