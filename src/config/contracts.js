// Contract Addresses on Arc Testnet
export const CONTRACTS = {
  PAYMENT_ROUTER: '0xc6757Ea8dfD57778a6107f3a4772534948Ab7b64', // Your deployed address
  USDC: '0x3600000000000000000000000000000000000000',
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
};

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

export const PAYMENT_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "payee", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "uint256", name: "paymentId", type: "uint256" }
    ],
    name: "requestPaymentWithPermit",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "paymentId", type: "uint256" }],
    name: "isPaymentProcessed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  }
];

export const parseAmount = (amount, decimals = 6) => {
  if (isNaN(parseFloat(amount))) return 0n;
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
};

export const formatAmount = (amount, decimals = 6) => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(2);
};
// Thêm định nghĩa cho các hằng số trạng thái (nếu cần)
// export const TRANSACTION_STATUS = {
//   PENDING: 0,
//   PROCESSING: 1,
//   COMPLETED: 2,
//   FAILED: 3,
//   CANCELLED: 4,
// };

export const getStatusLabel = (status) => {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Processing";
    case 2:
      return "Completed";
    case 3:
      return "Failed";
    case 4:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 0: // Pending
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case 1: // Processing
      return "bg-blue-100 text-blue-800 border-blue-300";
    case 2: // Completed
      return "bg-green-100 text-green-800 border-green-300";
    case 3: // Failed
      return "bg-red-100 text-red-800 border-red-300";
    case 4: // Cancelled
      return "bg-gray-100 text-gray-800 border-gray-300";
    default:
      return "bg-gray-100 text-gray-500 border-gray-300";
  }
};