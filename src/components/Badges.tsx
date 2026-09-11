import { cn } from '@/lib/utils';
import type { AgentStatus, RiskLevel, TaskStatus, LogLevel } from '@/types';

const statusConfig: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-success-500/15 text-success-400 border-success-500/20', dot: 'bg-success-400' },
  idle: { label: 'Idle', color: 'bg-surface-700/50 text-surface-400 border-surface-600', dot: 'bg-surface-500' },
  paused: { label: 'Paused', color: 'bg-accent-500/15 text-accent-400 border-accent-500/20', dot: 'bg-accent-400' },
  error: { label: 'Error', color: 'bg-error-500/15 text-error-400 border-error-500/20', dot: 'bg-error-400' },
};

export function AgentStatusBadge({ status, size = 'md' }: { status: AgentStatus; size?: 'sm' | 'md' }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn('badge border', cfg.color, size === 'sm' && 'px-2 py-0.5 text-[10px]')}>
      <span className={cn('status-dot', cfg.dot, status === 'active' && 'animate-pulse')} />
      {cfg.label}
    </span>
  );
}

const riskConfig: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Low Risk', color: 'bg-success-500/15 text-success-400 border-success-500/20' },
  medium: { label: 'Medium Risk', color: 'bg-accent-500/15 text-accent-400 border-accent-500/20' },
  high: { label: 'High Risk', color: 'bg-error-500/15 text-error-400 border-error-500/20' },
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const cfg = riskConfig[risk];
  return <span className={cn('badge border', cfg.color)}>{cfg.label}</span>;
}

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-surface-700/50 text-surface-400 border-surface-600' },
  queued: { label: 'Queued', color: 'bg-secondary-500/15 text-secondary-400 border-secondary-500/20' },
  running: { label: 'Running', color: 'bg-accent-500/15 text-accent-400 border-accent-500/20' },
  completed: { label: 'Completed', color: 'bg-success-500/15 text-success-400 border-success-500/20' },
  failed: { label: 'Failed', color: 'bg-error-500/15 text-error-400 border-error-500/20' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const cfg = taskStatusConfig[status];
  return (
    <span className={cn('badge border', cfg.color)}>
      {status === 'running' && <span className="status-dot bg-accent-400 animate-pulse" />}
      {status === 'queued' && <span className="status-dot bg-secondary-400 animate-pulse" />}
      {cfg.label}
    </span>
  );
}

const logLevelConfig: Record<LogLevel, { color: string; dot: string }> = {
  info: { color: 'text-secondary-400', dot: 'bg-secondary-400' },
  success: { color: 'text-success-400', dot: 'bg-success-400' },
  warning: { color: 'text-accent-400', dot: 'bg-accent-400' },
  error: { color: 'text-error-400', dot: 'bg-error-400' },
};

export function LogLevelIndicator({ level }: { level: LogLevel }) {
  const cfg = logLevelConfig[level];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('status-dot', cfg.dot)} />
      <span className={cn('text-xs font-medium', cfg.color)}>{level.toUpperCase()}</span>
    </span>
  );
}
