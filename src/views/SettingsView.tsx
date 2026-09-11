import { Shield, Network, Zap, DollarSign, ExternalLink } from 'lucide-react';

export function SettingsView() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-surface-100">Settings</h2>
        <p className="text-sm text-surface-400 mt-1">Manage your studio configuration</p>
      </div>

      {/* Network settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-500/15 flex items-center justify-center">
            <Network className="w-5 h-5 text-secondary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Network Configuration</h3>
            <p className="text-xs text-surface-500">Connected blockchain networks</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Ethereum Mainnet', chainId: '1', status: 'connected', latency: '120ms' },
            { name: 'Arbitrum One', chainId: '42161', status: 'connected', latency: '85ms' },
            { name: 'Base', chainId: '8453', status: 'connected', latency: '92ms' },
            { name: 'Optimism', chainId: '10', status: 'available', latency: '—' },
          ].map((net) => (
            <div key={net.name} className="flex items-center justify-between py-2.5 border-b border-surface-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`status-dot ${net.status === 'connected' ? 'bg-success-400' : 'bg-surface-600'}`} />
                <div>
                  <p className="text-xs font-medium text-surface-200">{net.name}</p>
                  <p className="text-[10px] text-surface-500">Chain ID: {net.chainId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-surface-500">{net.latency}</span>
                <span className={`badge border text-[10px] ${
                  net.status === 'connected'
                    ? 'bg-success-500/15 text-success-400 border-success-500/20'
                    : 'bg-surface-800 text-surface-400 border-surface-700'
                }`}>
                  {net.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Execution Defaults</h3>
            <p className="text-xs text-surface-500">Default parameters for new agents</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Default Slippage (%)</label>
            <input className="input-field" type="number" step="0.1" defaultValue="0.5" />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Default Max Gas (Gwei)</label>
            <input className="input-field" type="number" defaultValue="50" />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Default Stop Loss (%)</label>
            <input className="input-field" type="number" step="0.5" defaultValue="15" />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Default Take Profit (%)</label>
            <input className="input-field" type="number" step="1" defaultValue="50" />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Security</h3>
            <p className="text-xs text-surface-500">Wallet and transaction security settings</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
            <div>
              <p className="text-xs font-medium text-surface-200">Transaction Confirmation</p>
              <p className="text-[10px] text-surface-500 mt-0.5">Require manual approval for transactions over $10,000</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-700 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
            <div>
              <p className="text-xs font-medium text-surface-200">Auto-Compound Guard</p>
              <p className="text-[10px] text-surface-500 mt-0.5">Pause agent if gas exceeds 2x average for 3 consecutive txs</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-surface-700 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success-500/15 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-success-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Usage & Billing</h3>
            <p className="text-xs text-surface-500">Your current plan and usage</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
            <p className="text-[10px] text-surface-500 uppercase tracking-wider">Plan</p>
            <p className="text-sm font-bold text-surface-100 mt-1">Studio Pro</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
            <p className="text-[10px] text-surface-500 uppercase tracking-wider">Agents Used</p>
            <p className="text-sm font-bold text-surface-100 mt-1">3 / 25</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
            <p className="text-[10px] text-surface-500 uppercase tracking-wider">Tasks This Month</p>
            <p className="text-sm font-bold text-surface-100 mt-1">1,247</p>
          </div>
        </div>
      </div>
    </div>
  );
}
