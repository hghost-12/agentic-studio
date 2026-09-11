import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AgentStatusBadge, RiskBadge, TaskStatusBadge, LogLevelIndicator } from '@/components/Badges';
import { AGENT_TYPE_META, TASK_TYPE_META, type Agent, type Task, type ActivityLog, type AgentSnapshot, type TaskType, type TaskPriority } from '@/types';
import { formatCurrency, successRate, timeAgo, formatDateTime, shortAddress } from '@/lib/utils';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import {
  ArrowLeft, Play, Pause, Trash2, Plus, Droplets, Sprout, ArrowLeftRight,
  Crosshair, Scale, Bot, Activity, ListTodo, Settings, ExternalLink,
  ArrowDownToLine, Wheat, Zap, TrendingUp,
} from 'lucide-react';

const iconMap = { Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot };
const taskIconMap = { Droplets, ArrowDownToLine, Scale, Wheat, ArrowLeftRight, ListTodo };

interface AgentDetailProps {
  agent: Agent;
  tasks: Task[];
  logs: ActivityLog[];
  snapshots: AgentSnapshot[];
  snapshotsLoading?: boolean;
  onBack: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onCreateTask: (params: { title: string; description?: string; task_type: TaskType; priority: TaskPriority; input_params: Record<string, unknown> }) => void;
  onRunTask: (taskId: string) => void;
}

type Tab = 'overview' | 'performance' | 'tasks' | 'activity' | 'config';

const TASK_TEMPLATES: { type: TaskType; label: string; description: string; icon: string }[] = [
  { type: 'liquidity_provision', label: 'Provide Liquidity', description: 'Add liquidity to the configured pool', icon: 'Droplets' },
  { type: 'harvest', label: 'Harvest Rewards', description: 'Claim accumulated trading fees and rewards', icon: 'Wheat' },
  { type: 'rebalance', label: 'Rebalance Position', description: 'Adjust position range based on market conditions', icon: 'Scale' },
  { type: 'withdrawal', label: 'Withdraw Position', description: 'Remove liquidity and close position', icon: 'ArrowDownToLine' },
  { type: 'swap', label: 'Execute Swap', description: 'Perform a token swap via the DEX', icon: 'ArrowLeftRight' },
  { type: 'custom', label: 'Custom Task', description: 'Define a custom task for the agent', icon: 'ListTodo' },
];

export function AgentDetail({ agent, tasks, logs, snapshots, snapshotsLoading, onBack, onToggleStatus, onDelete, onCreateTask, onRunTask }: AgentDetailProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = AGENT_TYPE_META[agent.agent_type];
  const IconName = meta.icon;
  const Icon = iconMap[IconName as keyof typeof iconMap] ?? Bot;
  const rate = successRate(agent.successful_tasks, agent.total_tasks);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button onClick={onBack} className="btn-ghost text-xs">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Agents
      </button>

      {/* Agent header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              agent.status === 'active' ? 'bg-primary-600/15 text-primary-400' : 'bg-surface-800 text-surface-400'
            )}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-surface-100">{agent.name}</h2>
                <AgentStatusBadge status={agent.status} size="sm" />
              </div>
              <p className="text-sm text-surface-400 mt-1">{meta.label} · {agent.protocol} · {agent.chain}</p>
              {agent.description && <p className="text-xs text-surface-500 mt-2 max-w-lg">{agent.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleStatus} className={cn(
              'btn-secondary',
              agent.status === 'active' ? 'text-accent-400' : 'text-primary-400'
            )}>
              {agent.status === 'active' ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Activate</>}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost text-error-400 hover:bg-error-500/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-surface-800">
          <div>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Total Tasks</p>
            <p className="text-xl font-bold text-surface-100 mt-0.5">{agent.total_tasks}</p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Success Rate</p>
            <p className={cn('text-xl font-bold mt-0.5', rate >= 80 ? 'text-success-400' : rate >= 50 ? 'text-accent-400' : 'text-error-400')}>{rate}%</p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Value Managed</p>
            <p className="text-xl font-bold text-surface-100 mt-0.5">{formatCurrency(agent.total_value)}</p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Last Active</p>
            <p className="text-xl font-bold text-surface-100 mt-0.5">{timeAgo(agent.last_active_at)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-800">
        {([
          { id: 'overview' as const, label: 'Overview', icon: Activity },
          { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
          { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
          { id: 'activity' as const, label: 'Activity Log', icon: Zap },
          { id: 'config' as const, label: 'Configuration', icon: Settings },
        ]).map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                tab === t.id
                  ? 'text-primary-400 border-primary-500'
                  : 'text-surface-400 border-transparent hover:text-surface-200'
              )}
            >
              <TabIcon className="w-4 h-4" />
              {t.label}
              {t.id === 'tasks' && tasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-800 text-surface-400">{tasks.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Strategy Parameters</h3>
            <div className="space-y-2">
              {Object.entries({
                'Token Pair': `${agent.config.token0 ?? '—'}/${agent.config.token1 ?? '—'}`,
                'Fee Tier': agent.config.feeTier ? `${agent.config.feeTier} bps` : '—',
                'Position Size': agent.config.amount ?? '—',
                'Slippage Tolerance': agent.config.slippageTolerance ? `${agent.config.slippageTolerance}%` : '—',
                'Max Gas Price': agent.config.maxGasPriceGwei ? `${agent.config.maxGasPriceGwei} Gwei` : '—',
                'Stop Loss': agent.config.stopLossPercent ? `${agent.config.stopLossPercent}%` : '—',
                'Take Profit': agent.config.takeProfitPercent ? `${agent.config.takeProfitPercent}%` : '—',
                'Rebalance Threshold': agent.config.rebalanceThreshold ? `${agent.config.rebalanceThreshold}%` : '—',
                'Target APY': agent.config.targetAPY ? `${agent.config.targetAPY}%` : '—',
                'Auto-Compound': agent.config.autoCompound ? 'Enabled' : 'Disabled',
              }).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                  <span className="text-xs text-surface-500">{key}</span>
                  <span className="text-xs font-medium text-surface-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-surface-200 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {TASK_TEMPLATES.map((tmpl) => {
                  const TaskIcon = taskIconMap[tmpl.icon as keyof typeof taskIconMap] ?? ListTodo;
                  return (
                    <button
                      key={tmpl.type}
                      onClick={() => {
                        onCreateTask({
                          title: tmpl.label,
                          description: tmpl.description,
                          task_type: tmpl.type,
                          priority: 'medium',
                          input_params: {},
                        });
                      }}
                      className="text-left p-3 rounded-lg bg-surface-800/40 border border-surface-700/40 hover:border-primary-600/30 hover:bg-surface-800/60 transition-all group"
                    >
                      <TaskIcon className="w-4 h-4 text-surface-400 group-hover:text-primary-400 transition-colors mb-2" />
                      <p className="text-xs font-medium text-surface-200">{tmpl.label}</p>
                      <p className="text-[10px] text-surface-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {agent.config.poolAddress && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-surface-200 mb-3">Pool Address</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900/60 border border-surface-700/40">
                  <code className="text-xs font-mono text-surface-300">{shortAddress(agent.config.poolAddress)}</code>
                  <button className="btn-ghost p-1.5" onClick={() => navigator.clipboard?.writeText(agent.config.poolAddress!)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {agent.config.customInstructions && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-surface-200 mb-2">Custom Instructions</h3>
                <p className="text-xs text-surface-400 leading-relaxed">{agent.config.customInstructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="animate-slide-up">
          <PerformanceCharts snapshots={snapshots} loading={snapshotsLoading} />
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200">Task History</h3>
            <button onClick={() => setShowTaskModal(true)} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <ListTodo className="w-8 h-8 text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-400">No tasks executed yet</p>
              <p className="text-xs text-surface-500 mt-1">Create a task to see execution history here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const taskMeta = TASK_TYPE_META[task.task_type];
                const TaskIcon = taskIconMap[taskMeta.icon as keyof typeof taskIconMap] ?? ListTodo;
                return (
                  <div key={task.id} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                      <TaskIcon className="w-4 h-4 text-surface-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {taskMeta.label} · {formatDateTime(task.created_at)}
                        {task.gas_estimate > 0 && ` · Est. gas: $${task.gas_estimate.toFixed(2)}`}
                      </p>
                      {task.error_message && (
                        <p className="text-xs text-error-400 mt-1">{task.error_message}</p>
                      )}
                      {task.tx_hash && (
                        <p className="text-xs text-secondary-400 mt-1 font-mono">tx: {shortAddress(task.tx_hash)}</p>
                      )}
                    </div>
                    {(task.status === 'queued' || task.status === 'pending') && (
                      <button
                        onClick={() => onRunTask(task.id)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-3 animate-slide-up">
          <h3 className="text-sm font-semibold text-surface-200">Activity Log</h3>
          {logs.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Zap className="w-8 h-8 text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-400">No activity logged yet</p>
            </div>
          ) : (
            <div className="glass-card p-4 space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-surface-800/50 last:border-0">
                  <LogLevelIndicator level={log.level} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-surface-200">{log.message}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Agent Configuration</h3>
            <div className="space-y-2">
              <ConfigRow label="Agent Type" value={meta.label} />
              <ConfigRow label="Protocol" value={agent.protocol ?? '—'} />
              <ConfigRow label="Blockchain" value={agent.chain} />
              <ConfigRow label="Risk Level" value={<RiskBadge risk={agent.risk_level} />} />
              <ConfigRow label="Created" value={formatDateTime(agent.created_at)} />
              <ConfigRow label="Last Updated" value={formatDateTime(agent.updated_at)} />
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-surface-200 mb-3">Raw Configuration (JSON)</h3>
            <pre className="text-xs font-mono text-surface-300 bg-surface-950/60 p-4 rounded-lg overflow-x-auto border border-surface-800">
              {JSON.stringify(agent.config, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Task creation modal */}
      {showTaskModal && (
        <TaskCreateModal
          onClose={() => setShowTaskModal(false)}
          onCreate={(params) => {
            onCreateTask(params);
            setShowTaskModal(false);
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-error-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-100">Delete Agent?</h3>
                <p className="text-xs text-surface-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-surface-400 mb-5">
              You're about to delete <span className="font-semibold text-surface-200">{agent.name}</span> and all its tasks and activity logs.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
              <button onClick={onDelete} className="btn-primary bg-error-600 hover:bg-error-500 shadow-error-900/30">
                <Trash2 className="w-4 h-4" />
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
      <span className="text-xs text-surface-500">{label}</span>
      <span className="text-xs font-medium text-surface-200">{value}</span>
    </div>
  );
}

function TaskCreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (params: { title: string; description?: string; task_type: TaskType; priority: TaskPriority; input_params: Record<string, unknown> }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('custom');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-surface-100 mb-4">Create New Task</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Task Title</label>
            <input className="input-field" placeholder="e.g. Add liquidity to ETH/USDC" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1.5 block">Description</label>
            <textarea className="input-field min-h-[60px] resize-none" placeholder="What should the agent do?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">Task Type</label>
              <select className="select-field" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
                {Object.entries(TASK_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">Priority</label>
              <select className="select-field" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onCreate({ title: title.trim() || 'Untitled Task', description: description.trim() || undefined, task_type: taskType, priority, input_params: {} })}
            disabled={!title.trim()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
