import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AreaChart, BarChart, type ChartPoint } from '@/components/Charts';
import type { AgentSnapshot } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Flame, Percent, Activity } from 'lucide-react';

type TimeRange = '7d' | '14d' | '30d';

interface PerformanceChartsProps {
  snapshots: AgentSnapshot[];
  loading?: boolean;
}

function snapshotToChartPoints(snapshots: AgentSnapshot[], field: keyof AgentSnapshot): ChartPoint[] {
  return snapshots.map((s) => ({
    label: new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: typeof s[field] === 'number' ? s[field] as number : 0,
  }));
}

export function PerformanceCharts({ snapshots, loading }: PerformanceChartsProps) {
  const [range, setRange] = useState<TimeRange>('30d');

  const filtered = useMemo(() => {
    const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return snapshots.filter((s) => new Date(s.recorded_at) >= cutoff);
  }, [snapshots, range]);

  const valueData = useMemo(() => snapshotToChartPoints(filtered, 'total_value'), [filtered]);
  const pnlData = useMemo(() => snapshotToChartPoints(filtered, 'pnl'), [filtered]);
  const apyData = useMemo(() => snapshotToChartPoints(filtered, 'apy_estimate'), [filtered]);
  const successData = useMemo(() => snapshotToChartPoints(filtered, 'task_success_rate'), [filtered]);

  // Summary stats
  const latest = filtered[filtered.length - 1];
  const first = filtered[0];
  const totalPnl = latest && first ? latest.total_value - first.total_value : 0;
  const totalPnlPct = latest && first && first.total_value > 0 ? ((latest.total_value - first.total_value) / first.total_value) * 100 : 0;
  const totalGas = filtered.reduce((sum, s) => sum + s.gas_spent, 0);
  const totalFees = filtered.reduce((sum, s) => sum + s.fees_earned, 0);
  const avgApy = filtered.length > 0 ? filtered.reduce((sum, s) => sum + s.apy_estimate, 0) / filtered.length : 0;
  const netProfit = totalFees - totalGas;

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center" style={{ minHeight: 200 }}>
        <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Activity className="w-8 h-8 text-surface-600 mx-auto mb-3" />
        <p className="text-sm text-surface-400">No performance data yet</p>
        <p className="text-xs text-surface-500 mt-1">Performance charts will appear once the agent starts running tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Time range selector + summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-900/60 border border-surface-800">
          {(['7d', '14d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                range === r ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            {totalPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-success-400" /> : <TrendingDown className="w-3.5 h-3.5 text-error-400" />}
            <span className="text-surface-500">P&L:</span>
            <span className={cn('font-semibold', totalPnl >= 0 ? 'text-success-400' : 'text-error-400')}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} ({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat
          icon={DollarSign}
          label="Net Profit"
          value={`${netProfit >= 0 ? '+' : ''}${formatCurrency(netProfit)}`}
          positive={netProfit >= 0}
        />
        <SummaryStat
          icon={Flame}
          label="Gas Spent"
          value={formatCurrency(totalGas)}
          negative
        />
        <SummaryStat
          icon={Percent}
          label="Avg APY"
          value={`${avgApy.toFixed(1)}%`}
          positive
        />
        <SummaryStat
          icon={DollarSign}
          label="Fees Earned"
          value={formatCurrency(totalFees)}
          positive
        />
      </div>

      {/* Main value chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Portfolio Value</h3>
            <p className="text-[10px] text-surface-500 mt-0.5">Total value managed over time</p>
          </div>
          {latest && (
            <p className="text-lg font-bold text-surface-100">{formatCurrency(latest.total_value)}</p>
          )}
        </div>
        <AreaChart data={valueData} color="primary" formatValue={(v) => formatCurrency(v)} height={200} />
      </div>

      {/* P&L and APY side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-surface-200">Daily P&L</h3>
              <p className="text-[10px] text-surface-500 mt-0.5">Profit/loss per day</p>
            </div>
          </div>
          <BarChart data={pnlData} color="accent" formatValue={(v) => `${v >= 0 ? '+' : ''}$${v.toFixed(2)}`} height={160} />
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-surface-200">APY Estimate</h3>
              <p className="text-[10px] text-surface-500 mt-0.5">Annualized yield over time</p>
            </div>
            {latest && (
              <p className="text-lg font-bold text-success-400">{latest.apy_estimate.toFixed(1)}%</p>
            )}
          </div>
          <AreaChart data={apyData} color="success" formatValue={(v) => `${v.toFixed(1)}%`} height={160} />
        </div>
      </div>

      {/* Task success rate */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-surface-200">Task Success Rate</h3>
            <p className="text-[10px] text-surface-500 mt-0.5">Rolling success rate over time</p>
          </div>
          {latest && (
            <p className="text-lg font-bold text-secondary-400">{latest.task_success_rate.toFixed(0)}%</p>
          )}
        </div>
        <AreaChart data={successData} color="secondary" formatValue={(v) => `${v.toFixed(0)}%`} height={140} />
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, positive, negative }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const color = positive ? 'text-success-400' : negative ? 'text-error-400' : 'text-surface-200';
  return (
    <div className="glass-card p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn('w-3.5 h-3.5', positive ? 'text-success-400' : negative ? 'text-error-400' : 'text-surface-500')} />
        <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={cn('text-sm font-bold', color)}>{value}</p>
    </div>
  );
}
