import { cn } from '@/lib/utils';
import { WalletAvatar } from '@/components/WalletAvatar';
import {
  Bot, Wallet, AlertCircle, Loader2, ArrowRight, Shield, Zap, TrendingUp,
} from 'lucide-react';

interface ConnectScreenProps {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}

export function ConnectScreen({ onConnect, connecting, error }: ConnectScreenProps) {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary-600/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-xl shadow-primary-900/40 mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-surface-100">AgentForge</h1>
          <p className="text-sm text-surface-500 mt-1">Web3 Agent Studio</p>
        </div>

        {/* Connect card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-surface-950/50">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-surface-100">Connect your wallet</h2>
            <p className="text-sm text-surface-400 mt-2 leading-relaxed">
              Connect your browser wallet to create agents, manage DeFi positions, and track performance. Your wallet address becomes your account identity.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-500/10 border border-error-500/20 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-error-400 shrink-0 mt-0.5" />
              <p className="text-xs text-error-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Connect button */}
          <button
            onClick={onConnect}
            disabled={connecting}
            className="w-full btn-primary py-3.5 text-base relative"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect Wallet
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-surface-800 space-y-3">
            {[
              { icon: Shield, text: 'Your wallet is your identity — no passwords, no emails' },
              { icon: Zap, text: 'Create and deploy DeFi agents in seconds' },
              { icon: TrendingUp, text: 'Track performance with real-time charts' },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-800/60 border border-surface-700/40 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <p className="text-xs text-surface-400">{feat.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* No wallet hint */}
        <p className="text-center text-[11px] text-surface-600 mt-4">
          Don't have a wallet? Install{' '}
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 underline underline-offset-2">
            MetaMask
          </a>
          {' '}or{' '}
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 underline underline-offset-2">
            Coinbase Wallet
          </a>
        </p>
      </div>
    </div>
  );
}
