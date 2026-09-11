import { useMemo } from 'react';
import { StatCard, AgentCard } from '@/components/AgentCard';
import { AgentStatusBadge } from '@/components/Badges';
import { AreaChart, type ChartPoint } from '@/components/Charts';
import type { Agent, Task, AgentSnapshot } from '@/types';
import { formatCurrency, successRate, timeAgo } from '@/lib/utils';
import { Bot, Activity, DollarSign, TrendingUp, Plus, ArrowLeftRight } from 'lucide-react';

interface DashboardProps {
  agents: Agent[];
  recentTasks: (Task & { agents?: { name: string } })[];
  allSnapshots: (AgentSnapshot & { agents?: { name: string } })[];
  onAgentClick: (id: string) => void;
  onCreateAgent: () => void;
}

export function Dashboard({ agents, recentTasks, allSnapshots, onAgentClick, onCreateAgent }: DashboardProps) {
  const activeCount = agents.filter((a) => a.status === 'active').length;
  const totalValue = agents.reduce((sum, a) => sum + a.total_value, 0);
  const totalTasks = agents.reduce((sum, a) => sum + a.total_tasks, 0);
  const totalSuccess = agents.reduce((sum, a) => sum + a.successful_tasks, 0);
  const avgRate = successRate(totalSuccess, totalTasks);

  // Aggregate all snapshots by date into a portfolio value chart
  const portfolioData = useMemo<ChartPoint[]>(() => {
    const byDate = new Map<string, number>();
    for (const snap of allSnapshots) {
      const dateKey = new Date(snap.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + snap.total_value);
    }
    return Array.from(byDate.entries()).map(([label, value]) => ({ label, value }));
  }, [allSnapshots]);

  // Calculate portfolio P&L
  const firstVal = portfolioData[0]?.value ?? 0;
  const lastVal = portfolioData[portfolioData.length - 1]?.value ?? 0;
  const pnl = lastVal - firstVal;
  const pnlPct = firstVal > 0 ? (pnl / firstVal) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100">Studio Dashboard</h2>
          <p className="text-sm text-surface-400 mt-1">Monitor your Web3 agents and DeFi operations</p>
        </div>
        <button onClick={onCreateAgent} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Agents" value={activeCount} icon={Bot} trend={`${agents.length} total agents`} color="primary" />
        <StatCard label="Total Value" value={formatCurrency(totalValue)} icon={DollarSign} trend={`across all positions`} color="success" />
        <StatCard label="Tasks Executed" value={totalTasks} icon={Activity} trend={`${avgRate}% success rate`} color="secondary" />
        <StatCard label="Avg Success" value={`${avgRate}%`} icon={TrendingUp} trend={`${totalSuccess} successful tasks`} color="accent" />
      </div>

      {/* Portfolio performance chart */}
      {portfolioData.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-surface-200">Portfolio Performance</h3>
              <p className="text-[10px] text-surface-500 mt-0.5">Aggregate value across all agents (30 days)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-surface-100">{formatCurrency(lastVal)}</p>
                <p className={`text-xs font-semibold ${pnl >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
          <AreaChart data={portfolioData} color="primary" formatValue={(v) => formatCurrency(v)} height={200} />
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200">Your Agents</h3>
            <span className="text-xs text-surface-500">{agents.length} agents</span>
          </div>
          {agents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-surface-600" />
              </div>
              <h4 className="text-sm font-semibold text-surface-200">No agents yet</h4>
              <p className="text-xs text-surface-500 mt-1 mb-4">Create your first Web3 agent to get started</p>
              <button onClick={onCreateAgent} className="btn-primary">
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.id} agent={agent} onClick={() => onAgentClick(agent.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-surface-200">Recent Activity</h3>
          <div className="glass-card p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {recentTasks.length === 0 ? (
              <p className="text-xs text-surface-500 text-center py-8">No recent activity</p>
            ) : (
              recentTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-start gap-3 py-2 border-b border-surface-800/50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-200 truncate">{task.title}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">
                      {task.agents?.name ?? 'Unknown'} · {timeAgo(task.created_at)}
                    </p>
                  </div>
                  <AgentStatusBadge status={task.status === 'completed' ? 'active' : task.status === 'failed' ? 'error' : 'idle'} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
