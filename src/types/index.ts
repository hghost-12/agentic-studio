export type AgentType =
  | 'liquidity'
  | 'yield'
  | 'arbitrage'
  | 'sniper'
  | 'rebalancer'
  | 'custom';

export type AgentStatus = 'active' | 'idle' | 'paused' | 'error';

export type RiskLevel = 'low' | 'medium' | 'high';

export type Chain = 'Ethereum' | 'Arbitrum' | 'Base' | 'Optimism' | 'Polygon' | 'Solana' | 'BSC';

export type Protocol =
  | 'Uniswap V3'
  | 'Uniswap V2'
  | 'Aave'
  | 'Curve'
  | 'Balancer'
  | 'Compound'
  | 'SushiSwap'
  | 'PancakeSwap'
  | 'GMX'
  | 'Custom';

export type TaskType =
  | 'liquidity_provision'
  | 'withdrawal'
  | 'rebalance'
  | 'harvest'
  | 'swap'
  | 'custom';

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface AgentConfig {
  poolAddress?: string;
  token0?: string;
  token1?: string;
  feeTier?: number;
  minTick?: number;
  maxTick?: number;
  amount?: string;
  slippageTolerance?: number;
  autoCompound?: boolean;
  rebalanceThreshold?: number;
  maxGasPriceGwei?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  targetAPY?: number;
  customInstructions?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: AgentType;
  status: AgentStatus;
  protocol: string | null;
  chain: Chain;
  config: AgentConfig;
  risk_level: RiskLevel;
  total_tasks: number;
  successful_tasks: number;
  total_value: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  input_params: Record<string, unknown>;
  output_result: Record<string, unknown> | null;
  gas_estimate: number;
  tx_hash: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ActivityLog {
  id: string;
  agent_id: string;
  task_id: string | null;
  message: string;
  level: LogLevel;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentSnapshot {
  id: string;
  agent_id: string;
  recorded_at: string;
  total_value: number;
  pnl: number;
  pnl_percent: number;
  apy_estimate: number;
  gas_spent: number;
  fees_earned: number;
  position_count: number;
  task_success_rate: number;
}

export interface AgentWithStats extends Agent {
  recent_tasks?: Task[];
  recent_logs?: ActivityLog[];
}

export const AGENT_TYPE_META: Record<AgentType, { label: string; description: string; icon: string }> = {
  liquidity: {
    label: 'Liquidity Provider',
    description: 'Provides liquidity to DEX pools and manages positions',
    icon: 'Droplets',
  },
  yield: {
    label: 'Yield Farmer',
    description: 'Seeks and auto-compounds yield opportunities',
    icon: 'Sprout',
  },
  arbitrage: {
    label: 'Arbitrage Bot',
    description: 'Monitors price differences across DEXs and exploits gaps',
    icon: 'ArrowLeftRight',
  },
  sniper: {
    label: 'Token Sniper',
    description: 'Monitors new token launches and executes early entries',
    icon: 'Crosshair',
  },
  rebalancer: {
    label: 'Portfolio Rebalancer',
    description: 'Maintains target portfolio allocations automatically',
    icon: 'Scale',
  },
  custom: {
    label: 'Custom Agent',
    description: 'Fully configurable agent for custom strategies',
    icon: 'Bot',
  },
};

export const AGENT_TYPE_OPTIONS: { value: AgentType; label: string; description: string }[] = [
  { value: 'liquidity', label: 'Liquidity Provider', description: 'Provide liquidity to DEX pools, manage ranges, auto-compound fees' },
  { value: 'yield', label: 'Yield Farmer', description: 'Find optimal yield pools, auto-compound rewards, shift when better rates appear' },
  { value: 'arbitrage', label: 'Arbitrage Bot', description: 'Monitor cross-DEX price gaps and execute profitable arbitrage trades' },
  { value: 'sniper', label: 'Token Sniper', description: 'Watch new pair deployments and enter positions at launch' },
  { value: 'rebalancer', label: 'Portfolio Rebalancer', description: 'Keep portfolio at target allocations with threshold-based rebalancing' },
  { value: 'custom', label: 'Custom Agent', description: 'Define your own Web3 agent strategy from scratch' },
];

export const CHAIN_OPTIONS: Chain[] = ['Ethereum', 'Arbitrum', 'Base', 'Optimism', 'Polygon', 'BSC', 'Solana'];

export const PROTOCOL_OPTIONS: Protocol[] = [
  'Uniswap V3', 'Uniswap V2', 'Aave', 'Curve', 'Balancer',
  'Compound', 'SushiSwap', 'PancakeSwap', 'GMX', 'Custom',
];

export const TASK_TYPE_META: Record<TaskType, { label: string; icon: string }> = {
  liquidity_provision: { label: 'Provide Liquidity', icon: 'Droplets' },
  withdrawal: { label: 'Withdraw Position', icon: 'ArrowDownToLine' },
  rebalance: { label: 'Rebalance', icon: 'Scale' },
  harvest: { label: 'Harvest Rewards', icon: 'Wheat' },
  swap: { label: 'Token Swap', icon: 'ArrowLeftRight' },
  custom: { label: 'Custom Task', icon: 'ListTodo' },
};
