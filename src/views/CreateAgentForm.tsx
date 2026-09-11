import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AGENT_TYPE_OPTIONS, CHAIN_OPTIONS, PROTOCOL_OPTIONS,
  type AgentType, type Chain, type Protocol, type RiskLevel, type AgentConfig,
} from '@/types';
import { X, ArrowLeft, ArrowRight, Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot, Check } from 'lucide-react';

const iconMap = { Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot };

interface CreateAgentFormProps {
  onClose: () => void;
  onCreate: (params: {
    name: string;
    description: string;
    agent_type: AgentType;
    status: 'idle';
    protocol: string;
    chain: Chain;
    config: AgentConfig;
    risk_level: RiskLevel;
  }) => Promise<void>;
}

const STEPS = ['Type', 'Identity', 'Configuration', 'Review'];

export function CreateAgentForm({ onClose, onCreate }: CreateAgentFormProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agentType, setAgentType] = useState<AgentType>('liquidity');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState<Protocol>('Uniswap V3');
  const [chain, setChain] = useState<Chain>('Ethereum');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');

  // Config fields
  const [poolAddress, setPoolAddress] = useState('');
  const [token0, setToken0] = useState('');
  const [token1, setToken1] = useState('');
  const [feeTier, setFeeTier] = useState('3000');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [autoCompound, setAutoCompound] = useState(true);
  const [rebalanceThreshold, setRebalanceThreshold] = useState('10');
  const [maxGasPrice, setMaxGasPrice] = useState('50');
  const [stopLoss, setStopLoss] = useState('15');
  const [takeProfit, setTakeProfit] = useState('50');
  const [targetAPY, setTargetAPY] = useState('25');
  const [customInstructions, setCustomInstructions] = useState('');

  const canProceed = () => {
    if (step === 0) return !!agentType;
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return true;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const config: AgentConfig = {
        poolAddress: poolAddress || undefined,
        token0: token0 || undefined,
        token1: token1 || undefined,
        feeTier: feeTier ? parseInt(feeTier) : undefined,
        amount: amount || undefined,
        slippageTolerance: slippage ? parseFloat(slippage) : undefined,
        autoCompound,
        rebalanceThreshold: rebalanceThreshold ? parseFloat(rebalanceThreshold) : undefined,
        maxGasPriceGwei: maxGasPrice ? parseFloat(maxGasPrice) : undefined,
        stopLossPercent: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfitPercent: takeProfit ? parseFloat(takeProfit) : undefined,
        targetAPY: targetAPY ? parseFloat(targetAPY) : undefined,
        customInstructions: customInstructions || undefined,
      };

      await onCreate({
        name: name.trim(),
        description: description.trim(),
        agent_type: agentType,
        status: 'idle',
        protocol,
        chain,
        config,
        risk_level: riskLevel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeMeta = AGENT_TYPE_OPTIONS.find((t) => t.value === agentType)!;
  const SelectedIcon = iconMap[selectedTypeMeta.label.split(' ')[0] as keyof typeof iconMap] ?? Bot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-2xl shadow-surface-950/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800 sticky top-0 bg-surface-900/90 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600/15 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-100">Create New Agent</h2>
              <p className="text-[10px] text-surface-500">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i <= step ? 'bg-primary-500' : 'bg-surface-800'
                )} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-xs text-error-400">
              {error}
            </div>
          )}

          {/* Step 0: Agent Type */}
          {step === 0 && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-1">Choose Agent Type</h3>
                <p className="text-xs text-surface-500">Select what your agent will do in the Web3 ecosystem</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AGENT_TYPE_OPTIONS.map((opt) => {
                  const Icon = iconMap[opt.label.split(' ')[0] as keyof typeof iconMap] ?? Bot;
                  const selected = agentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAgentType(opt.value)}
                      className={cn(
                        'text-left p-4 rounded-xl border transition-all duration-200',
                        selected
                          ? 'border-primary-500/50 bg-primary-600/10 shadow-lg shadow-primary-900/20'
                          : 'border-surface-800 bg-surface-900/40 hover:border-surface-700 hover:bg-surface-800/40'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'bg-primary-600/20 text-primary-400' : 'bg-surface-800 text-surface-400'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-semibold', selected ? 'text-primary-400' : 'text-surface-200')}>{opt.label}</p>
                          <p className="text-xs text-surface-500 mt-1 leading-relaxed">{opt.description}</p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-primary-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-1">Agent Identity</h3>
                <p className="text-xs text-surface-500">Name your agent and describe what it does</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/40 border border-surface-700/50">
                <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center">
                  <SelectedIcon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary-400">{selectedTypeMeta.label}</p>
                  <p className="text-[10px] text-surface-500">{selectedTypeMeta.description}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-400 mb-1.5 block">Agent Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. ETH/USDC Liquidity Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-400 mb-1.5 block">Description</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Describe what this agent will do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-surface-400 mb-1.5 block">Blockchain</label>
                  <select className="select-field" value={chain} onChange={(e) => setChain(e.target.value as Chain)}>
                    {CHAIN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-400 mb-1.5 block">Protocol</label>
                  <select className="select-field" value={protocol} onChange={(e) => setProtocol(e.target.value as Protocol)}>
                    {PROTOCOL_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-400 mb-1.5 block">Risk Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskLevel(r)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-xs font-medium border transition-all capitalize',
                        riskLevel === r
                          ? r === 'low' ? 'border-success-500/40 bg-success-500/10 text-success-400'
                            : r === 'medium' ? 'border-accent-500/40 bg-accent-500/10 text-accent-400'
                            : 'border-error-500/40 bg-error-500/10 text-error-400'
                          : 'border-surface-800 bg-surface-900/40 text-surface-400 hover:bg-surface-800/40'
                      )}
                    >
                      {r} Risk
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-1">Strategy Configuration</h3>
                <p className="text-xs text-surface-500">Set the parameters your agent will use to execute on-chain</p>
              </div>

              {/* Pool / Token config */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-800/30 border border-surface-700/40">
                <p className="text-xs font-semibold text-surface-300 uppercase tracking-wider">Pool Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Token 0</label>
                    <input className="input-field" placeholder="WETH" value={token0} onChange={(e) => setToken0(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Token 1</label>
                    <input className="input-field" placeholder="USDC" value={token1} onChange={(e) => setToken1(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Pool Address</label>
                    <input className="input-field font-mono text-xs" placeholder="0x..." value={poolAddress} onChange={(e) => setPoolAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Fee Tier (bps)</label>
                    <select className="select-field" value={feeTier} onChange={(e) => setFeeTier(e.target.value)}>
                      <option value="100">100 (0.01%)</option>
                      <option value="500">500 (0.05%)</option>
                      <option value="3000">3000 (0.3%)</option>
                      <option value="10000">10000 (1%)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-surface-500 mb-1 block">Position Size</label>
                  <input className="input-field" placeholder="e.g. 10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>

              {/* Risk / Execution config */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-800/30 border border-surface-700/40">
                <p className="text-xs font-semibold text-surface-300 uppercase tracking-wider">Execution Parameters</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Slippage Tolerance (%)</label>
                    <input className="input-field" type="number" step="0.1" value={slippage} onChange={(e) => setSlippage(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Max Gas Price (Gwei)</label>
                    <input className="input-field" type="number" value={maxGasPrice} onChange={(e) => setMaxGasPrice(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Stop Loss (%)</label>
                    <input className="input-field" type="number" step="0.5" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Take Profit (%)</label>
                    <input className="input-field" type="number" step="1" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Rebalance Threshold (%)</label>
                    <input className="input-field" type="number" step="0.5" value={rebalanceThreshold} onChange={(e) => setRebalanceThreshold(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-surface-500 mb-1 block">Target APY (%)</label>
                    <input className="input-field" type="number" step="0.5" value={targetAPY} onChange={(e) => setTargetAPY(e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-900/40 cursor-pointer hover:bg-surface-800/40 transition-colors">
                  <input type="checkbox" checked={autoCompound} onChange={(e) => setAutoCompound(e.target.checked)} className="w-4 h-4 accent-primary-500" />
                  <div>
                    <p className="text-xs font-medium text-surface-200">Auto-Compound Rewards</p>
                    <p className="text-[10px] text-surface-500">Automatically reinvest earned fees into the position</p>
                  </div>
                </label>
              </div>

              {/* Custom instructions */}
              <div>
                <label className="text-xs font-medium text-surface-400 mb-1.5 block">Custom Instructions (Optional)</label>
                <textarea
                  className="input-field min-h-[60px] resize-none"
                  placeholder="Any additional instructions for the agent..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <h3 className="text-sm font-semibold text-surface-200 mb-1">Review & Create</h3>
                <p className="text-xs text-surface-500">Confirm your agent configuration before deploying</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-600/10 border border-primary-600/20">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <SelectedIcon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-100">{name || 'Untitled Agent'}</p>
                    <p className="text-xs text-surface-400">{selectedTypeMeta.label} · {protocol} · {chain}</p>
                  </div>
                </div>

                {description && (
                  <div className="p-3 rounded-lg bg-surface-800/30 border border-surface-700/40">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-xs text-surface-300">{description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Risk Level', value: riskLevel, capitalize: true },
                    { label: 'Token Pair', value: `${token0 || '—'}/${token1 || '—'}` },
                    { label: 'Fee Tier', value: `${feeTier} bps` },
                    { label: 'Position Size', value: amount || '—' },
                    { label: 'Slippage', value: `${slippage}%` },
                    { label: 'Max Gas', value: `${maxGasPrice} Gwei` },
                    { label: 'Stop Loss', value: `${stopLoss}%` },
                    { label: 'Take Profit', value: `${takeProfit}%` },
                    { label: 'Rebalance At', value: `${rebalanceThreshold}%` },
                    { label: 'Target APY', value: `${targetAPY}%` },
                    { label: 'Auto-Compound', value: autoCompound ? 'Enabled' : 'Disabled' },
                    { label: 'Pool Address', value: poolAddress ? `${poolAddress.slice(0, 8)}…` : '—' },
                  ].map((item) => (
                    <div key={item.label} className="px-3 py-2 rounded-lg bg-surface-800/30 border border-surface-700/30">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-medium text-surface-200 mt-0.5 capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-800 sticky bottom-0 bg-surface-900/90 backdrop-blur-xl">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? (
                <>Creating…</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Deploy Agent
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
