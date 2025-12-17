// src/config/chains.js (FIXED)

// KHÔNG CẦN IMPORT defineChain: Định nghĩa mạng lưới dưới dạng đối tượng thuần túy
// để tránh lỗi module resolution.

// ****************************************************
// ĐỊNH NGHĨA MẠNG LƯỚI ARC TESTNET (EVM-COMPATIBLE)
// ****************************************************
// Chain ID: 5042002
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  // Arc sử dụng USDC làm token gas (native currency), với 6 số thập phân
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
  network: 'arc-testnet' // Thêm trường network cho khả năng tương thích cao hơn
};

// Xuất tất cả các chains cần thiết
export const allChains = [arcTestnet];