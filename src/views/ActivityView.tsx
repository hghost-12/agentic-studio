import { LogLevelIndicator } from '@/components/Badges';
import type { ActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Activity, Zap } from 'lucide-react';

interface ActivityViewProps {
  logs: (ActivityLog & { agents?: { name: string } })[];
}

export function ActivityView({ logs }: ActivityViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-100">Activity Log</h2>
        <p className="text-sm text-surface-400 mt-1">Real-time event stream from all your agents</p>
      </div>

      {logs.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Zap className="w-8 h-8 text-surface-600 mx-auto mb-3" />
          <p className="text-sm text-surface-400">No activity logged yet</p>
          <p className="text-xs text-surface-500 mt-1">Agent events will appear here as they execute tasks</p>
        </div>
      ) : (
        <div className="glass-card p-4 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-3 border-b border-surface-800/50 last:border-0 hover:bg-surface-800/20 px-2 -mx-2 rounded-lg transition-colors">
              <div className="shrink-0 mt-0.5">
                <LogLevelIndicator level={log.level} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-surface-200">{log.message}</p>
                  {log.agents?.name && (
                    <span className="badge border border-surface-700 bg-surface-800/50 text-surface-400 text-[10px] px-2 py-0.5">
                      {log.agents.name}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-surface-500 mt-1">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
