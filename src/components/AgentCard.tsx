import { cn } from '@/lib/utils';
import { AgentStatusBadge, RiskBadge } from '@/components/Badges';
import { agentTypeIcons } from '@/components/Sidebar';
import { AGENT_TYPE_META } from '@/types';
import type { Agent } from '@/types';
import { formatCurrency, successRate, timeAgo } from '@/lib/utils';
import { Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot, ChevronRight, TrendingUp } from 'lucide-react';

const iconMap = { Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot };

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  onToggleStatus?: () => void;
  compact?: boolean;
}

export function AgentCard({ agent, onClick, onToggleStatus, compact }: AgentCardProps) {
  const meta = AGENT_TYPE_META[agent.agent_type];
  const IconName = meta.icon;
  const Icon = iconMap[IconName as keyof typeof iconMap] ?? Bot;
  const rate = successRate(agent.successful_tasks, agent.total_tasks);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group glass-card p-5 cursor-pointer transition-all duration-200',
        'hover:border-primary-600/30 hover:bg-surface-900/60 hover:shadow-lg hover:shadow-surface-950/50',
        'animate-slide-up'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
            agent.status === 'active'
              ? 'bg-primary-600/15 text-primary-400'
              : 'bg-surface-800 text-surface-400'
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-100 text-sm leading-tight">{agent.name}</h3>
            <p className="text-xs text-surface-500 mt-0.5">{meta.label}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-primary-400 transition-colors" />
      </div>

      {!compact && agent.description && (
        <p className="text-xs text-surface-400 mb-4 line-clamp-2">{agent.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <AgentStatusBadge status={agent.status} size="sm" />
        <RiskBadge risk={agent.risk_level} />
        <span className="badge border border-surface-700 bg-surface-800/50 text-surface-400">
          {agent.chain}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-800">
        <div>
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Tasks</p>
          <p className="text-sm font-semibold text-surface-200 mt-0.5">{agent.total_tasks}</p>
        </div>
        <div>
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Success</p>
          <p className={cn(
            'text-sm font-semibold mt-0.5 flex items-center gap-1',
            rate >= 80 ? 'text-success-400' : rate >= 50 ? 'text-accent-400' : 'text-error-400'
          )}>
            {rate}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Value</p>
          <p className="text-sm font-semibold text-surface-200 mt-0.5">{formatCurrency(agent.total_value)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-800/50">
        <span className="text-[10px] text-surface-500">
          {agent.protocol} · Last active {timeAgo(agent.last_active_at)}
        </span>
        {onToggleStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-md transition-all',
              agent.status === 'active'
                ? 'text-accent-400 hover:bg-accent-500/10'
                : 'text-primary-400 hover:bg-primary-500/10'
            )}
          >
            {agent.status === 'active' ? 'Pause' : 'Activate'}
          </button>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  trend?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

export function StatCard({ label, value, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  const colors = {
    primary: 'from-primary-500/10 to-primary-600/5 text-primary-400',
    secondary: 'from-secondary-500/10 to-secondary-600/5 text-secondary-400',
    accent: 'from-accent-500/10 to-accent-600/5 text-accent-400',
    success: 'from-success-500/10 to-success-600/5 text-success-400',
  };
  return (
    <div className={cn('glass-card p-5 bg-gradient-to-br', colors[color])}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-surface-400 font-medium uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <p className="text-2xl font-bold text-surface-100">{value}</p>
      {trend && <p className="text-xs text-surface-500 mt-1">{trend}</p>}
    </div>
  );
}
