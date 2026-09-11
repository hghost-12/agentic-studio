import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

interface AreaChartProps {
  data: ChartPoint[];
  height?: number;
  color?: 'primary' | 'secondary' | 'success' | 'accent' | 'error';
  formatValue?: (v: number) => string;
  showAxes?: boolean;
  showGrid?: boolean;
}

const colorMap = {
  primary: { stroke: '#34d274', fill: 'rgba(52, 210, 116, 0.12)', text: 'text-primary-400' },
  secondary: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.12)', text: 'text-secondary-400' },
  success: { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.12)', text: 'text-success-400' },
  accent: { stroke: '#facc15', fill: 'rgba(250, 204, 21, 0.12)', text: 'text-accent-400' },
  error: { stroke: '#f87171', fill: 'rgba(248, 113, 113, 0.12)', text: 'text-error-400' },
};

export function AreaChart({
  data,
  height = 180,
  color = 'primary',
  formatValue = (v) => v.toFixed(2),
  showAxes = true,
  showGrid = true,
}: AreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const { points, areaPath, linePath, minVal, maxVal, gridLines } = useMemo(() => {
    if (data.length === 0) {
      return { points: [] as { x: number; y: number; d: ChartPoint }[], areaPath: '', linePath: '', minVal: 0, maxVal: 0, gridLines: [] as number[] };
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin || 1;

    const pts = data.map((d, i) => ({
      x: padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
      y: padY + chartH - ((d.value - paddedMin) / paddedRange) * chartH,
      d,
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x} ${padY + chartH} L ${pts[0].x} ${padY + chartH} Z`;

    const grids = [0, 0.25, 0.5, 0.75, 1].map((t) => paddedMin + t * paddedRange);

    return { points: pts, areaPath: area, linePath: line, minVal: paddedMin, maxVal: paddedMax, gridLines: grids };
  }, [data, chartW, chartH, padX, padY]);

  const colors = colorMap[color];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-surface-600" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.round(((x - padX) / chartW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHoverIdx(idx);
        }}
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && gridLines.map((val, i) => {
          const y = padY + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
              {showAxes && (
                <text x={padX - 6} y={y + 3} textAnchor="end" className="fill-surface-600" style={{ fontSize: '9px' }}>
                  {formatValue(val)}
                </text>
              )}
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill={`url(#gradient-${color})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={colors.stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover tooltip */}
        {hoverIdx !== null && points[hoverIdx] && (
          <g>
            <line
              x1={points[hoverIdx].x}
              y1={padY}
              x2={points[hoverIdx].x}
              y2={padY + chartH}
              stroke={colors.stroke}
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
            <circle cx={points[hoverIdx].x} cy={points[hoverIdx].y} r="4" fill={colors.stroke} />
            <circle cx={points[hoverIdx].x} cy={points[hoverIdx].y} r="7" fill={colors.stroke} fillOpacity="0.2" />
          </g>
        )}

        {/* X-axis labels */}
        {showAxes && (
          <g>
            {data.map((d, i) => {
              if (data.length > 15 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null;
              const x = points[i]?.x ?? 0;
              return (
                <text key={i} x={x} y={height - 4} textAnchor="middle" className="fill-surface-600" style={{ fontSize: '9px' }}>
                  {d.label}
                </text>
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip overlay */}
      {hoverIdx !== null && data[hoverIdx] && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-surface-800 border border-surface-700 shadow-lg text-xs whitespace-nowrap z-10"
          style={{
            left: `${((points[hoverIdx]?.x ?? 0) / width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <p className="text-surface-500 text-[10px]">{data[hoverIdx].label}</p>
          <p className={cn('font-semibold', colors.text)}>{formatValue(data[hoverIdx].value)}</p>
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  color?: 'primary' | 'secondary' | 'success' | 'accent' | 'error';
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  height = 140,
  color = 'accent',
  formatValue = (v) => v.toFixed(2),
}: BarChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 600;
  const padX = 30;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const colors = colorMap[color];

  const { bars, maxVal } = useMemo(() => {
    if (data.length === 0) return { bars: [] as { x: number; w: number; h: number; d: ChartPoint }[], maxVal: 0 };
    const values = data.map((d) => d.value);
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const barW = chartW / data.length * 0.65;
    const gap = chartW / data.length * 0.35;

    const bs = data.map((d, i) => {
      const h = Math.abs(d.value) / range * chartH;
      const x = padX + i * (barW + gap) + gap / 2;
      return { x, w: barW, h, d };
    });
    return { bars: bs, maxVal: max };
  }, [data, chartW, chartH, padX, padY]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center text-xs text-surface-600" style={{ height }}>No data available</div>;
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {/* Zero line */}
        <line x1={padX} y1={padY + chartH} x2={width - padX} y2={padY + chartH} stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />

        {bars.map((bar, i) => {
          const isNeg = bar.d.value < 0;
          const y = isNeg ? padY + chartH : padY + chartH - bar.h;
          const isHover = hoverIdx === i;
          return (
            <rect
              key={i}
              x={bar.x}
              y={y}
              width={bar.w}
              height={Math.max(bar.h, 1)}
              rx="2"
              fill={isNeg ? '#f87171' : colors.stroke}
              fillOpacity={isHover ? 0.9 : 0.55}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="transition-all"
            />
          );
        })}

        {/* X labels */}
        {data.map((d, i) => {
          if (data.length > 12 && i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          const bar = bars[i];
          if (!bar) return null;
          return (
            <text key={i} x={bar.x + bar.w / 2} y={height - 3} textAnchor="middle" className="fill-surface-600" style={{ fontSize: '9px' }}>
              {d.label}
            </text>
          );
        })}
      </svg>

      {hoverIdx !== null && data[hoverIdx] && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg bg-surface-800 border border-surface-700 shadow-lg text-xs whitespace-nowrap z-10"
          style={{
            left: `${((bars[hoverIdx]?.x ?? 0) / width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <p className="text-surface-500 text-[10px]">{data[hoverIdx].label}</p>
          <p className={cn('font-semibold', data[hoverIdx].value < 0 ? 'text-error-400' : colors.text)}>{formatValue(data[hoverIdx].value)}</p>
        </div>
      )}
    </div>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 80, height = 24, color = '#34d274' }: SparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="inline-block" style={{ width, height }}>
      <path d={areaPath} fill={color} fillOpacity="0.1" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
