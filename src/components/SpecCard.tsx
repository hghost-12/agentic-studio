import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AgentSpec } from '@/lib/agentParser';
import { AGENT_TYPE_META } from '@/types';
import type { AgentType, AgentConfig } from '@/types';
import {
  Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot,
  Check, Pencil, ChevronDown, ChevronUp, Terminal, FileText,
} from 'lucide-react';

const iconMap: Record<string, typeof Bot> = {
  Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot,
};

interface SpecCardProps {
  spec: AgentSpec;
  onCreate: () => void;
  onEdit: () => void;
  creating?: boolean;
}

export function SpecCard({ spec, onCreate, onEdit, creating }: SpecCardProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const meta = AGENT_TYPE_META[spec.agent_type as AgentType];
  const Icon = iconMap[meta.icon] ?? Bot;
  const cfg = spec.config as AgentConfig;

  const paramRows: { label: string; value: string }[] = [];
  if (cfg.token0 && cfg.token1) paramRows.push({ label: 'Token Pair', value: `${cfg.token0}/${cfg.token1}` });
  if (cfg.feeTier) paramRows.push({ label: 'Fee Tier', value: `${cfg.feeTier} bps` });
  if (cfg.amount) paramRows.push({ label: 'Position Size', value: `$${cfg.amount}` });
  if (cfg.slippageTolerance) paramRows.push({ label: 'Slippage', value: `${cfg.slippageTolerance}%` });
  if (cfg.maxGasPriceGwei) paramRows.push({ label: 'Max Gas', value: `${cfg.maxGasPriceGwei} Gwei` });
  if (cfg.stopLossPercent) paramRows.push({ label: 'Stop Loss', value: `${cfg.stopLossPercent}%` });
  if (cfg.takeProfitPercent) paramRows.push({ label: 'Take Profit', value: `${cfg.takeProfitPercent}%` });
  if (cfg.rebalanceThreshold) paramRows.push({ label: 'Rebalance At', value: `${cfg.rebalanceThreshold}%` });
  if (cfg.targetAPY) paramRows.push({ label: 'Target APY', value: `${cfg.targetAPY}%` });
  paramRows.push({ label: 'Auto-Compound', value: cfg.autoCompound ? 'Enabled' : 'Disabled' });

  const riskColor = spec.risk_level === 'low' ? 'text-success-400 bg-success-500/10 border-success-500/20'
    : spec.risk_level === 'medium' ? 'text-accent-400 bg-accent-500/10 border-accent-500/20'
    : 'text-error-400 bg-error-500/10 border-error-500/20';

  return (
    <div className="rounded-xl border border-primary-600/30 bg-gradient-to-br from-primary-600/5 to-surface-900/60 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-surface-800/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-600/15 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-surface-100 truncate">{spec.name}</h4>
              <span className="text-[10px] text-primary-400 font-medium bg-primary-600/10 px-2 py-0.5 rounded-full shrink-0">
                SPEC CARD
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-0.5">{meta.label}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Description</p>
          <p className="text-xs text-surface-300 leading-relaxed">{spec.description}</p>
        </div>

        {/* Core attributes */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('badge border text-[10px] capitalize', riskColor)}>
            {spec.risk_level} risk
          </span>
          <span className="badge border border-surface-700 bg-surface-800/50 text-surface-400 text-[10px]">
            {spec.chain}
          </span>
          <span className="badge border border-surface-700 bg-surface-800/50 text-surface-400 text-[10px]">
            {spec.protocol}
          </span>
        </div>

        {/* Parameters grid */}
        <div>
          <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-2">Parameters</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paramRows.map((row) => (
              <div key={row.label} className="px-2.5 py-2 rounded-lg bg-surface-800/30 border border-surface-700/30">
                <p className="text-[9px] text-surface-500 uppercase tracking-wider">{row.label}</p>
                <p className="text-xs font-medium text-surface-200 mt-0.5">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System prompt (collapsible) */}
        <div className="rounded-lg bg-surface-950/40 border border-surface-800/50 overflow-hidden">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-secondary-400" />
              <span className="text-xs font-medium text-surface-300">System Prompt</span>
            </div>
            {showPrompt ? <ChevronUp className="w-3.5 h-3.5 text-surface-500" /> : <ChevronDown className="w-3.5 h-3.5 text-surface-500" />}
          </button>
          {showPrompt && (
            <pre className="px-3 pb-3 text-[11px] font-mono text-surface-400 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {spec.systemPrompt}
            </pre>
          )}
        </div>

        {/* Pool address (if present) */}
        {cfg.poolAddress && (
          <div className="flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-surface-500" />
            <span className="text-surface-500">Pool:</span>
            <code className="font-mono text-surface-400">{cfg.poolAddress.slice(0, 10)}…{cfg.poolAddress.slice(-6)}</code>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-surface-800/50 bg-surface-900/40">
        <button
          onClick={onCreate}
          disabled={creating}
          className="btn-primary flex-1 text-xs"
        >
          <Check className="w-3.5 h-3.5" />
          {creating ? 'Creating…' : 'Create this agent'}
        </button>
        <button onClick={onEdit} className="btn-secondary text-xs">
          <Pencil className="w-3.5 h-3.5" />
          Keep editing
        </button>
      </div>
    </div>
  );
}
