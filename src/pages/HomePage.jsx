import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, TrendingUp, Loader2 } from 'lucide-react';
import FeatureCard from '../components/common/FeatureCard';
import StatCard from '../components/common/StatCard';
import { useWeb3 } from '../contexts/Web3Context';

const HomePage = ({ onNavigate }) => {
  const { provider } = useWeb3();
  const [stats, setStats] = useState({
    volume: '$2.5M+',
    transactions: '12,000+',
    fee: '0.05%',
    settlement: '<2s'
  });
  const [loading, setLoading] = useState(false);

  // You can fetch real stats from Arc blockchain here
  useEffect(() => {
    const fetchStats = async () => {
      if (!provider) return;

      setLoading(true);
      try {
        // TODO: Implement real stats fetching from Arc blockchain
        // Example: Query swap events, calculate volume, etc.

        // Mock for now
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [provider]);

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center max-w-5xl mx-auto mb-20">
        <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
          <span className="text-purple-300 text-sm font-medium">
            🚀 Built on Arc Testnet
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Instant FX Swaps
          </span>
          <br />
          <span className="text-white">Across Stablecoins</span>
        </h1>

        <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
          Experience lightning-fast stablecoin swaps (USDC, VNDC, JPYC, KRWC, ....) with zero counterparty risk.
          Built on Arc Network with Permit2 technology for gasless approvals.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNavigate('swap')}
            className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-xl shadow-purple-500/25"
          >
            <span>Launch App</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="https://explorer-testnet.arc.network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/10 transition-all"
          >
            <span>View on Explorer</span>
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
        <FeatureCard
          icon={<Shield className="w-8 h-8" />}
          title="Atomic Swaps"
          description="PvP settlement ensures you receive tokens instantly when sending. Zero counterparty risk with on-chain guarantees."
          gradient="from-purple-500 to-pink-500"
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="Gasless Approvals"
          description="Sign transactions off-chain with Permit2. No more expensive approval transactions, just instant swaps."
          gradient="from-blue-500 to-cyan-500"
        />
        <FeatureCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Real-Time Pricing"
          description="Accurate FX rates powered by on-chain price feeds. Transparent 0.05% spread with live market data."
          gradient="from-pink-500 to-orange-500"
        />
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Live Network Statistics
        </h2>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard value={stats.volume} label="Total Volume" />
            <StatCard value={stats.transactions} label="Transactions" />
            <StatCard value={stats.fee} label="Spread Fee" />
            <StatCard value={stats.settlement} label="Avg Settlement" />
          </div>
        )}
      </div>

      {/* How it Works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">
              1
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Connect Wallet</h3>
              <p className="text-gray-400 text-sm">
                Connect your MetaMask or Web3 wallet to Arc Testnet network.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold">
              2
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Grant Master Approval</h3>
              <p className="text-gray-400 text-sm">
                One-time approval for Permit2 contract. This enables gasless transactions for all future swaps.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold">
              3
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Execute Swap</h3>
              <p className="text-gray-400 text-sm">
                Sign off-chain and swap instantly. Atomic settlement ensures both parties receive their tokens simultaneously.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;