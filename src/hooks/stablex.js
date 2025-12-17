// src/services/stablefx-integration.js
// StableFX Integration Service cho Arc Network

import { ethers } from 'ethers';

// Arc Testnet Configuration
export const ARC_CONFIG = {
    chainId: 26, // Arc Testnet domain
    rpcUrl: 'https://testnet-rpc.arc.network',
    explorer: 'https://testnet.arcscan.app',
};

// StableFX Contracts trên Arc Testnet
export const STABLEFX_CONTRACTS = {
    FX_ESCROW: '0x1f91886C7028986aD885ffCee0e40b75C9cd5aC1',
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    USDC: '0x3600000000000000000000000000000000000000',
    EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
};

// Supported currency pairs trên StableFX
export const SUPPORTED_PAIRS = [
    { from: 'USDC', to: 'EURC', decimals: 6 },
    { from: 'EURC', to: 'USDC', decimals: 6 },
    // Sẽ mở rộng khi thêm các stablecoin khác từ Circle Partner Stablecoins
];

// ABI cho FxEscrow Contract
export const FX_ESCROW_ABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "quoteId", "type": "bytes32" },
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "address", "name": "tokenOut", "type": "address" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
        ],
        "name": "executeSwap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "quoteId", "type": "bytes32" }],
        "name": "getSwapStatus",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Permit2 ABI
export const PERMIT2_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint160", "name": "amount", "type": "uint160" },
            { "internalType": "uint48", "name": "expiration", "type": "uint48" }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "user", "type": "address" },
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [
            { "internalType": "uint160", "name": "amount", "type": "uint160" },
            { "internalType": "uint48", "name": "expiration", "type": "uint48" },
            { "internalType": "uint48", "name": "nonce", "type": "uint48" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// ERC20 ABI cơ bản
export const ERC20_ABI = [
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
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
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

/**
 * StableFX Service Class
 * Xử lý việc tích hợp với StableFX API và smart contracts
 */
export class StableFXService {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api-sandbox.circle.com/v1/stablefx'; // Sandbox URL
        // Khi production: 'https://api.circle.com/v1/stablefx'
    }

    /**
     * Step 1: Request Quote từ StableFX
     * Gửi yêu cầu báo giá cho cặp tiền tệ
     */
    async requestQuote(fromToken, toToken, amount) {
        try {
            // DEMO MODE: Trả về mock data nếu không có API key
            if (!this.apiKey) {
                return this._getMockQuote(fromToken, toToken, amount);
            }

            // PRODUCTION MODE: Call API thực
            const response = await fetch(`${this.baseUrl}/quotes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromCurrency: fromToken,
                    toCurrency: toToken,
                    fromAmount: amount,
                    settlementType: 'INSTANT', // hoặc 'DEFERRED'
                }),
            });

            if (!response.ok) {
                throw new Error(`StableFX API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error requesting quote:', error);
            throw error;
        }
    }

    /**
     * Step 2: Accept Quote
     * Chấp nhận báo giá và chuẩn bị settlement onchain
     */
    async acceptQuote(quoteId) {
        try {
            if (!this.apiKey) {
                return this._getMockAcceptance(quoteId);
            }

            const response = await fetch(`${this.baseUrl}/quotes/${quoteId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to accept quote: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error accepting quote:', error);
            throw error;
        }
    }

    /**
     * Step 3: Grant Allowance to Permit2
     * Cần thiết trước khi thực hiện swap
     */
    async grantPermit2Allowance(provider, tokenAddress, amount) {
        try {
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

            // Check current allowance
            const userAddress = await signer.getAddress();
            const currentAllowance = await tokenContract.allowance(
                userAddress,
                STABLEFX_CONTRACTS.PERMIT2
            );

            // Nếu allowance đủ, không cần approve
            if (currentAllowance.gte(amount)) {
                console.log('Sufficient allowance already granted');
                return { success: true, message: 'Allowance already sufficient' };
            }

            // Approve Permit2
            const tx = await tokenContract.approve(
                STABLEFX_CONTRACTS.PERMIT2,
                ethers.constants.MaxUint256 // Approve max để không phải approve lại
            );

            await tx.wait();

            return {
                success: true,
                txHash: tx.hash,
                message: 'Permit2 allowance granted successfully'
            };
        } catch (error) {
            console.error('Error granting Permit2 allowance:', error);
            throw error;
        }
    }

    /**
     * Step 4: Execute Swap Onchain
     * Thực hiện swap thông qua FxEscrow contract
     */
    async executeSwap(provider, quoteData) {
        try {
            const signer = provider.getSigner();
            const escrowContract = new ethers.Contract(
                STABLEFX_CONTRACTS.FX_ESCROW,
                FX_ESCROW_ABI,
                signer
            );

            // Execute swap
            const tx = await escrowContract.executeSwap(
                quoteData.quoteId,
                quoteData.tokenIn,
                quoteData.tokenOut,
                quoteData.amountIn,
                quoteData.amountOut
            );

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                message: 'Swap executed successfully'
            };
        } catch (error) {
            console.error('Error executing swap:', error);
            throw error;
        }
    }

    /**
     * Get real-time FX rates từ StableFX liquidity providers
     */
    async getRates() {
        try {
            if (!this.apiKey) {
                return this._getMockRates();
            }

            const response = await fetch(`${this.baseUrl}/rates`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching rates:', error);
            return this._getMockRates();
        }
    }

    // ============ MOCK DATA HELPERS (cho demo) ============

    _getMockQuote(fromToken, toToken, amount) {
        const rate = fromToken === 'USDC' && toToken === 'EURC' ? 0.92 : 1.087;
        const amountOut = (parseFloat(amount) * rate).toFixed(6);
        const quoteId = `0x${Date.now().toString(16).padStart(64, '0')}`;

        return {
            quoteId,
            fromCurrency: fromToken,
            toCurrency: toToken,
            fromAmount: amount,
            toAmount: amountOut,
            rate: rate.toString(),
            expiresAt: new Date(Date.now() + 30000).toISOString(), // 30 seconds
            provider: 'Demo Liquidity Provider',
            fees: '0.05%',
            estimatedGas: '0.001 USDC'
        };
    }

    _getMockAcceptance(quoteId) {
        return {
            quoteId,
            status: 'ACCEPTED',
            settlementInstructions: {
                tokenIn: STABLEFX_CONTRACTS.USDC,
                tokenOut: STABLEFX_CONTRACTS.EURC,
                amountIn: '1000000', // 1 USDC (6 decimals)
                amountOut: '920000', // 0.92 EURC (6 decimals)
            },
            message: 'Quote accepted. Ready for onchain settlement.'
        };
    }

    _getMockRates() {
        return {
            "USDC/EURC": {
                "rate": 0.87,
                "change": "+0.2%",
                "volume24h": "11M",
                "high24h": 0.88,
                "low24h": 0.86,
                "lastUpdate": "2025-12-15T00:00:00Z"
            },
            "EURC/USDC": {
                "rate": 1.15,
                "change": "-0.2%",
                "volume24h": "6M",
                "high24h": 1.16,
                "low24h": 1.14,
                "lastUpdate": "2025-12-15T00:00:00Z"
            },
            "USD/JPY": {
                "rate": 165,
                "change": "+0.1%",
                "volume24h": "6.3M",
                "high24h": 170,
                "low24h": 160,
                "lastUpdate": "2025-12-15T00:00:00Z"
            },
            "USD/KRW": {
                "rate": 17.7,
                "change": "-0.1%",
                "volume24h": "5.6M",
                "high24h": 18.0,
                "low24h": 17.5,
                "lastUpdate": "2025-12-15T00:00:00Z"
            },
            "GBP/USDC": {
                "rate": 0.76,
                "change": "+0.3%",
                "volume24h": "192.1M",
                "high24h": 0.78,
                "low24h": 0.75,
                "lastUpdate": "2025-12-15T00:00:00Z"
            },
            "CNY/USDC": {
                "rate": 3.65,
                "change": "+0.1%",
                "volume24h": "201.5M",
                "high24h": 3.70,
                "low24h": 3.60,
                "lastUpdate": "2025-12-15T00:00:00Z"
            }
        };

    }
}

/**
 * Helper Functions
 */

// Parse amount với decimals
export function parseTokenAmount(amount, decimals = 6) {
    return ethers.utils.parseUnits(amount.toString(), decimals);
}

// Format amount từ BigNumber
export function formatTokenAmount(amount, decimals = 6) {
    return ethers.utils.formatUnits(amount, decimals);
}

// Kiểm tra kết nối Arc Network
export async function checkArcConnection(provider) {
    try {
        const network = await provider.getNetwork();
        if (network.chainId !== ARC_CONFIG.chainId) {
            throw new Error(`Wrong network. Please switch to Arc Testnet (Chain ID: ${ARC_CONFIG.chainId})`);
        }
        return true;
    } catch (error) {
        console.error('Arc connection error:', error);
        return false;
    }
}

// Get token contract instance
export function getTokenContract(provider, tokenAddress) {
    return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
}

// Check user's token balance
export async function checkBalance(provider, tokenAddress, userAddress) {
    try {
        const tokenContract = getTokenContract(provider, tokenAddress);
        const balance = await tokenContract.balanceOf(userAddress);
        return formatTokenAmount(balance);
    } catch (error) {
        console.error('Error checking balance:', error);
        return '0';
    }
}

export default StableFXService;