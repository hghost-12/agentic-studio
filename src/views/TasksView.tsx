import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskStatusBadge } from '@/components/Badges';
import { TASK_TYPE_META, type Task } from '@/types';
import { formatDateTime, shortAddress } from '@/lib/utils';
import { ListTodo, Droplets, ArrowDownToLine, Scale, Wheat, ArrowLeftRight, Play } from 'lucide-react';

const taskIconMap = { Droplets, ArrowDownToLine, Scale, Wheat, ArrowLeftRight, ListTodo };

interface TasksViewProps {
  tasks: (Task & { agents?: { name: string } })[];
  onRunTask?: (taskId: string, agentId: string) => void;
}

const STATUS_FILTERS = ['all', 'queued', 'running', 'completed', 'failed'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export function TasksView({ tasks, onRunTask }: TasksViewProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter);
  const counts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? tasks.length : tasks.filter((t) => t.status === f).length;
    return acc;
  }, {} as Record<StatusFilter, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-100">Tasks</h2>
        <p className="text-sm text-surface-400 mt-1">View and manage all tasks across your agents</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-900/60 border border-surface-800 w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
              filter === f ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
            )}
          >
            {f} <span className="opacity-50">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Tasks table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ListTodo className="w-8 h-8 text-surface-600 mx-auto mb-3" />
          <p className="text-sm text-surface-400">No tasks found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800 text-left">
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Gas Est.</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const taskMeta = TASK_TYPE_META[task.task_type];
                  const TaskIcon = taskIconMap[taskMeta.icon as keyof typeof taskIconMap] ?? ListTodo;
                  return (
                    <tr key={task.id} className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                            <TaskIcon className="w-3.5 h-3.5 text-surface-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-surface-200 truncate">{task.title}</p>
                            {task.tx_hash && <p className="text-[10px] text-secondary-400 font-mono">{shortAddress(task.tx_hash)}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-400">{task.agents?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-surface-400">{taskMeta.label}</td>
                      <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                      <td className="px-4 py-3 text-xs text-surface-400">${task.gas_estimate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-surface-500">{formatDateTime(task.created_at)}</td>
                      <td className="px-4 py-3">
                        {(task.status === 'queued' || task.status === 'pending') && onRunTask && (
                          <button
                            onClick={() => onRunTask(task.id, task.agent_id)}
                            className="btn-ghost text-xs text-primary-400 hover:bg-primary-500/10 p-1.5"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
