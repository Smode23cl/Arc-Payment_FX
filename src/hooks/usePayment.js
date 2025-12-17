// src/hooks/usePayment.js (ĐÃ SỬA: THÊM FIELD SPENDER)

import { useState, useMemo, useCallback } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
  useChainId,
  useAccount,
  useReadContract,
  useSimulateContract,
} from 'wagmi';
import { parseAmount, CONTRACTS, PAYMENT_ROUTER_ABI, ERC20_ABI } from '../config/contracts';
import { maxUint256 } from 'viem';

const generateUniquePaymentId = () => {
  const randomSuffix = BigInt(Math.floor(Math.random() * 10000));
  const timestamp = BigInt(Date.now());
  return (timestamp * 10000n) + randomSuffix;
};

// ✅ CẤU TRÚC ĐÚNG CHO PERMIT2 (CÓ SPENDER!)
const PERMIT2_TYPES = {
  'TokenPermissions': [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  'PermitTransferFrom': [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' }, // 🔥 THÊM FIELD NÀY!
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ],
};

export default function usePayment() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  const { signTypedDataAsync } = useSignTypedData();

  const {
    data: hash,
    writeContract: writePayment,
    isPending: isWriting,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({ hash });

  // Check allowance
  const { data: allowanceData } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address || '0x', CONTRACTS.PERMIT2],
    query: { enabled: !!address }
  });

  // Check balance
  const { data: balanceData } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address || '0x'],
    query: { enabled: !!address }
  });

  const needsApproval = useMemo(() => {
    if (!allowanceData) return true;
    console.log('💰 Current allowance for Permit2:', allowanceData.toString());
    return allowanceData < maxUint256 / 2n;
  }, [allowanceData]);

  const { data: approveConfig } = useSimulateContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACTS.PERMIT2, maxUint256],
    query: { enabled: !!address && needsApproval }
  });

  const { writeContract: writeApprove } = useWriteContract();

  const checkAndRequestApproval = useCallback(async () => {
    if (!needsApproval) {
      console.log('✅ Already approved');
      return true;
    }

    if (!approveConfig?.request) {
      setError("Cannot prepare approve transaction");
      return false;
    }

    try {
      setIsApproving(true);
      console.log('🔄 Requesting approval for Permit2...');
      await writeApprove(approveConfig.request);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Chờ confirm
      console.log('✅ Approve complete!');
      return true;
    } catch (err) {
      console.error('❌ Approve error:', err);
      setError(`Approval failed: ${err.message?.split('\n')[0]}`);
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [needsApproval, approveConfig?.request, writeApprove]);

  const requestPaymentWithPermit = useCallback(async ({ payee, amount, currency }) => {
    try {
      setError(null);

      // =================================================================
      // BƯỚC 0: KIỂM TRA CƠ BẢN
      // =================================================================
      console.log('\n========================================');
      console.log('🚀 STARTING PERMIT2 PAYMENT');
      console.log('========================================');

      console.log('📊 User info:');
      console.log('  - Address:', address);
      console.log('  - ChainId:', chainId, typeof chainId);
      console.log('  - Balance:', balanceData?.toString() || 'unknown');

      // Kiểm tra balance
      const decimals = 6;
      const amountInWei = parseAmount(amount, decimals);

      if (balanceData && balanceData < amountInWei) {
        const msg = `Insufficient balance. Have: ${balanceData.toString()}, Need: ${amountInWei.toString()}`;
        console.error('❌', msg);
        setError(msg);
        return;
      }

      // =================================================================
      // BƯỚC 1: APPROVE (NẾU CẦN)
      // =================================================================
      const isApproved = await checkAndRequestApproval();
      if (!isApproved) {
        console.error('❌ Approval failed or cancelled');
        return;
      }

      // =================================================================
      // BƯỚC 2: CHUẨN BỊ DỮ LIỆU
      // =================================================================
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const paymentId = generateUniquePaymentId();
      const tokenAddress = CONTRACTS.USDC;
      const spenderAddress = CONTRACTS.PAYMENT_ROUTER; // 🔥 PaymentRouter contract

      console.log('\n📝 Payment parameters:');
      console.log('  - From:', address);
      console.log('  - To:', payee);
      console.log('  - Spender:', spenderAddress); // 🔥 LOG SPENDER
      console.log('  - Token:', tokenAddress);
      console.log('  - Amount (wei):', amountInWei.toString());
      console.log('  - Amount (human):', amount);
      console.log('  - Deadline:', deadline.toString(), '(unix timestamp)');
      console.log('  - Nonce:', paymentId.toString());

      // =================================================================
      // BƯỚC 3: TẠO MESSAGE (CÓ SPENDER!)
      // =================================================================
      const permitMessage = {
        permitted: {
          token: tokenAddress,
          amount: amountInWei
        },
        spender: spenderAddress, // 🔥 THÊM FIELD NÀY!
        nonce: paymentId,
        deadline: deadline,
      };

      console.log('\n📄 Message to sign:');
      console.log(JSON.stringify(permitMessage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2));

      // =================================================================
      // BƯỚC 4: TẠO DOMAIN
      // =================================================================
      // CRITICAL: chainId PHẢI LÀ NUMBER!
      const domainChainId = Number(chainId);

      const domain = {
        name: "Permit2",
        chainId: domainChainId,
        verifyingContract: CONTRACTS.PERMIT2
      };

      console.log('\n🌍 Domain:');
      console.log(JSON.stringify(domain, null, 2));
      console.log('  - ChainId type:', typeof domainChainId);

      // =================================================================
      // BƯỚC 5: KÝ MESSAGE
      // =================================================================
      console.log('\n✍️ Signing Permit2 message...');
      console.log('Please approve in your wallet...');

      const signature = await signTypedDataAsync({
        domain,
        types: PERMIT2_TYPES,
        primaryType: 'PermitTransferFrom',
        message: permitMessage,
      });

      console.log('✅ Signature obtained:', signature);
      console.log('  - Length:', signature.length, '(should be 132)');

      // Parse signature
      const sig = signature.slice(2);
      const r = '0x' + sig.slice(0, 64);
      const s = '0x' + sig.slice(64, 128);
      const v = parseInt(sig.slice(128, 130), 16);

      console.log('  - r:', r);
      console.log('  - s:', s);
      console.log('  - v:', v, '(should be 27 or 28)');

      if (v !== 27 && v !== 28) {
        console.warn('⚠️ Unusual v value:', v);
      }

      // =================================================================
      // BƯỚC 6: GỌI SMART CONTRACT
      // =================================================================
      console.log('\n📤 Calling PaymentRouter contract...');
      console.log('Contract address:', CONTRACTS.PAYMENT_ROUTER);
      console.log('Function: requestPaymentWithPermit');
      console.log('Args:');
      console.log('  [0] payee:', payee);
      console.log('  [1] amount:', amountInWei.toString());
      console.log('  [2] token:', tokenAddress);
      console.log('  [3] deadline:', deadline.toString());
      console.log('  [4] signature:', signature);
      console.log('  [5] paymentId:', paymentId.toString());

      await writePayment({
        address: CONTRACTS.PAYMENT_ROUTER,
        abi: PAYMENT_ROUTER_ABI,
        functionName: 'requestPaymentWithPermit',
        args: [
          payee,
          amountInWei,
          tokenAddress,
          deadline,
          signature,
          paymentId
        ],
      });

      console.log('✅ Transaction sent successfully!');
      console.log('Waiting for confirmation...');
      console.log('========================================\n');

    } catch (err) {
      console.error('\n❌ PAYMENT ERROR ❌');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);

      let errorMessage = 'Transaction failed';

      if (err.message) {
        if (err.message.includes('User rejected') || err.message.includes('user rejected')) {
          errorMessage = 'You rejected the transaction';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient balance or gas';
        } else if (err.message.includes('DEADLINE_EXPIRED')) {
          errorMessage = 'Signature expired';
        } else if (err.message.includes('InvalidNonce') || err.message.includes('nonce')) {
          errorMessage = 'Nonce already used or invalid';
        } else if (err.message.includes('InvalidSigner') || err.message.includes('signature')) {
          errorMessage = 'Invalid signature - check message structure';
        } else if (err.message.includes('execution reverted')) {
          errorMessage = 'Contract execution failed - check console for details';
          console.error('\n🔍 DEBUG HINTS:');
          console.error('1. Check if msg.sender is the same as signature owner');
          console.error('2. Verify nonce hasn\'t been used before');
          console.error('3. Check deadline hasn\'t expired');
          console.error('4. Ensure token is approved to Permit2');
          console.error('5. Verify balance is sufficient');
        } else {
          errorMessage = err.message.split('\n')[0];
        }
      }

      setError(errorMessage);
      console.error('========================================\n');
      throw err;
    }
  }, [chainId, address, balanceData, signTypedDataAsync, writePayment, checkAndRequestApproval]);

  const reset = () => {
    setError(null);
    resetWrite();
  };

  const combinedError = error || writeError?.message || confirmError?.message;

  return {
    requestPayment: requestPaymentWithPermit,
    isPending: isWriting || isConfirming || isApproving,
    isWriting,
    isConfirming,
    isApproving,
    isSuccess,
    error: combinedError,
    txHash: hash,
    reset,
  };
}