import { useReadContract } from 'wagmi';
import { CONTRACTS, PAYMENT_ROUTER_ABI, formatAmount } from '../config/contracts';

// Mock transaction data for development and testing
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x1234567890123456789012345678901234567890',
    amount: 100,
    currency: 'USDC',
    timestamp: Date.now() - 3600000, // 1 hour ago
    status: 2, // Completed
    txHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abc123'
  },
  {
    id: 2,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0xabcdef1234567890abcdef1234567890abcdef12',
    amount: 250,
    currency: 'USDT',
    timestamp: Date.now() - 7200000, // 2 hours ago
    status: 2, // Completed
    txHash: '0xdef456789abc123def456789abc123def456789abc123def456789abc123def456'
  },
  {
    id: 3,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x9876543210987654321098765432109876543210',
    amount: 50,
    currency: 'VNDC',
    timestamp: Date.now() - 86400000, // 1 day ago
    status: 1, // Processing
    txHash: '0xghi789012345678ghi789012345678ghi789012345678ghi789012345678ghi'
  },
  {
    id: 4,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x5555555555555555555555555555555555555555',
    amount: 175.50,
    currency: 'EURC',
    timestamp: Date.now() - 172800000, // 2 days ago
    status: 2, // Completed
    txHash: '0xjkl012345678901jkl012345678901jkl012345678901jkl012345678901jkl'
  },
  {
    id: 5,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x6666666666666666666666666666666666666666',
    amount: 500,
    currency: 'USDC',
    timestamp: Date.now() - 259200000, // 3 days ago
    status: 0, // Pending
    txHash: '0xmno345678901234mno345678901234mno345678901234mno345678901234mno'
  },
  {
    id: 6,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x7777777777777777777777777777777777777777',
    amount: 75.25,
    currency: 'USDT',
    timestamp: Date.now() - 345600000, // 4 days ago
    status: 2, // Completed
    txHash: '0xpqr567890123456pqr567890123456pqr567890123456pqr567890123456pqr'
  },
  {
    id: 7,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x8888888888888888888888888888888888888888',
    amount: 320,
    currency: 'USDC',
    timestamp: Date.now() - 432000000, // 5 days ago
    status: 3, // Failed
    txHash: '0xstu789012345678stu789012345678stu789012345678stu789012345678stu'
  },
  {
    id: 8,
    payer: '0xAeeAe0B6dBD6EF6eFE2fec07a720c65AeFb2492A',
    payee: '0x9999999999999999999999999999999999999999',
    amount: 1250,
    currency: 'EURC',
    timestamp: Date.now() - 518400000, // 6 days ago
    status: 2, // Completed
    txHash: '0xvwx901234567890vwx901234567890vwx901234567890vwx901234567890vwx'
  },
];

/**
 * Custom hook to fetch and manage transaction history
 * @param {string} userAddress - User's wallet address
 * @returns {Object} Transactions data and utilities
 */
export default function useTransactions(userAddress) {
  // Fetch transactions from smart contract
  const {
    data,
    isError,
    isLoading,
    refetch,
    error
  } = useReadContract({
    address: CONTRACTS.PAYMENT_ROUTER,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'getPaymentHistory',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!userAddress,
    // Refetch every 30 seconds
    refetchInterval: 30000,
  });

  // Use mock data if:
  // 1. Contract call fails
  // 2. No data returned
  // 3. Development mode is enabled
  const useMockData = isError ||
    !data ||
    data.length === 0 ||
    import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

  const transactions = useMockData
    ? MOCK_TRANSACTIONS
    : formatTransactions(data);

  return {
    transactions,
    isLoading,
    isError,
    error,
    refetch,
    isMockData: useMockData,
  };
}

/**
 * Format raw transaction data from smart contract
 * @param {Array} rawData - Raw transaction array from contract
 * @returns {Array} Formatted transaction objects
 */
function formatTransactions(rawData) {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map(tx => {
    try {
      return {
        id: Number(tx.id || 0),
        payer: tx.payer || '0x0000000000000000000000000000000000000000',
        payee: tx.payee || '0x0000000000000000000000000000000000000000',
        amount: formatAmount(tx.amount || 0, 6),
        currency: tx.currency || 'USDC',
        timestamp: Number(tx.timestamp || 0) * 1000, // Convert to milliseconds
        status: Number(tx.status || 0),
        txHash: tx.txHash || '',
      };
    } catch (err) {
      console.error('Error formatting transaction:', err, tx);
      return null;
    }
  }).filter(tx => tx !== null);
}

/**
 * Get transaction by ID
 * @param {number} transactionId - Transaction ID to fetch
 * @returns {Object} Transaction data
 */
export function useTransactionById(transactionId) {
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACTS.PAYMENT_ROUTER,
    abi: PAYMENT_ROUTER_ABI,
    functionName: 'getPaymentById',
    args: transactionId ? [BigInt(transactionId)] : undefined,
    enabled: !!transactionId,
  });

  const transaction = data ? formatTransactions([data])[0] : null;

  return {
    transaction,
    isLoading,
    isError,
  };
}