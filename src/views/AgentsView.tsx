import { useState } from 'react';
import { AgentCard } from '@/components/AgentCard';
import type { Agent } from '@/types';
import { Plus, Search, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentsViewProps {
  agents: Agent[];
  onAgentClick: (id: string) => void;
  onCreateAgent: () => void;
  onToggleStatus: (id: string) => void;
}

const FILTERS = ['all', 'active', 'idle', 'paused', 'error'] as const;
type Filter = typeof FILTERS[number];

export function AgentsView({ agents, onAgentClick, onCreateAgent, onToggleStatus }: AgentsViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = agents.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterCounts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? agents.length : agents.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<Filter, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-100">Agents</h2>
          <p className="text-sm text-surface-400 mt-1">Manage your Web3 agent fleet</p>
        </div>
        <button onClick={onCreateAgent} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            className="input-field pl-10"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-900/60 border border-surface-800">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
                filter === f ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
              )}
            >
              {f} <span className="opacity-50">({filterCounts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
            <Bot className="w-7 h-7 text-surface-600" />
          </div>
          <h4 className="text-sm font-semibold text-surface-200">
            {search || filter !== 'all' ? 'No agents match your filters' : 'No agents yet'}
          </h4>
          <p className="text-xs text-surface-500 mt-1 mb-4">
            {search || filter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first Web3 agent to get started'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={onCreateAgent} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Agent
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => onAgentClick(agent.id)}
              onToggleStatus={() => onToggleStatus(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
