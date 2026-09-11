import type { AgentType, Chain, Protocol, RiskLevel, AgentConfig } from '@/types';
import { CHAIN_OPTIONS, PROTOCOL_OPTIONS } from '@/types';

export interface AgentSpec {
  name: string;
  description: string;
  agent_type: AgentType;
  protocol: string;
  chain: Chain;
  risk_level: RiskLevel;
  config: AgentConfig;
  systemPrompt: string;
}

const TYPE_KEYWORDS: { type: AgentType; words: string[] }[] = [
  { type: 'liquidity', words: ['liquidity', 'lp', 'pool', 'amm', 'market mak'] },
  { type: 'yield', words: ['yield', 'farm', 'staking', 'compound', 'reward', 'apr', 'apy'] },
  { type: 'arbitrage', words: ['arbitrage', 'arb', 'price gap', 'price difference', 'spread'] },
  { type: 'sniper', words: ['snipe', 'sniper', 'new token', 'launch', 'presale', 'fair launch'] },
  { type: 'rebalancer', words: ['rebalance', 'portfolio', 'allocation', 'ratio', 'weight'] },
];

const RISK_KEYWORDS: { level: RiskLevel; words: string[] }[] = [
  { level: 'high', words: ['aggressive', 'high risk', 'degen', 'max', 'yolo', 'all in', 'leverage'] },
  { level: 'low', words: ['safe', 'conservative', 'low risk', 'stable', 'secure', 'minimal'] },
];

function detectType(text: string): AgentType {
  const lower = text.toLowerCase();
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return type;
  }
  return 'custom';
}

function detectRisk(text: string): RiskLevel {
  const lower = text.toLowerCase();
  for (const { level, words } of RISK_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return level;
  }
  return 'medium';
}

function detectChain(text: string): Chain {
  const lower = text.toLowerCase();
  for (const chain of CHAIN_OPTIONS) {
    if (lower.includes(chain.toLowerCase())) return chain;
  }
  if (lower.includes('eth') || lower.includes('mainnet')) return 'Ethereum';
  if (lower.includes('arb')) return 'Arbitrum';
  if (lower.includes('op ')) return 'Optimism';
  if (lower.includes('matic')) return 'Polygon';
  if (lower.includes('bnb') || lower.includes('binance')) return 'BSC';
  return 'Ethereum';
}

function detectProtocol(text: string): string {
  const lower = text.toLowerCase();
  for (const proto of PROTOCOL_OPTIONS) {
    if (lower.includes(proto.toLowerCase())) return proto;
  }
  if (lower.includes('uni')) return 'Uniswap V3';
  if (lower.includes('aave')) return 'Aave';
  if (lower.includes('curve')) return 'Curve';
  if (lower.includes('balancer')) return 'Balancer';
  if (lower.includes('compound')) return 'Compound';
  if (lower.includes('sushi')) return 'SushiSwap';
  if (lower.includes('pancake')) return 'PancakeSwap';
  if (lower.includes('gmx')) return 'GMX';
  return 'Uniswap V3';
}

function extractTokenPair(text: string): { token0?: string; token1?: string } {
  const pairMatch = text.match(/(\w+)\s*\/\s*(\w+)/i);
  if (pairMatch) {
    return { token0: pairMatch[1].toUpperCase(), token1: pairMatch[2].toUpperCase() };
  }
  return {};
}

function extractAmount(text: string): string | undefined {
  const match = text.match(/(?:\$|usd\s*)?([\d,]+(?:\.\d+)?)\s*(?:k|thousand|dollars|usd|\$)?/i);
  if (match) {
    let val = parseFloat(match[1].replace(/,/g, ''));
    if (match[0].toLowerCase().includes('k')) val *= 1000;
    if (match[0].toLowerCase().includes('thousand')) val *= 1000;
    if (val > 0) return val.toString();
  }
  return undefined;
}

function extractPercent(text: string, keywords: string[]): number | undefined {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx >= 0) {
      const after = text.slice(idx + kw.length, idx + kw.length + 20);
      const pctMatch = after.match(/([\d.]+)\s*%/);
      if (pctMatch) return parseFloat(pctMatch[1]);
    }
  }
  return undefined;
}

function extractFeeTier(text: string): number | undefined {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:fee\s*tier|fee)\s*(?:of\s*)?(\d{2,5})\s*(?:bps|basis points)?/);
  if (match) {
    const val = parseInt(match[1]);
    if ([100, 500, 3000, 10000].includes(val)) return val;
  }
  if (lower.includes('0.01%') || lower.includes('0.01 %')) return 100;
  if (lower.includes('0.05%') || lower.includes('0.05 %')) return 500;
  if (lower.includes('0.3%') || lower.includes('0.3 %') || lower.includes('0.30%')) return 3000;
  if (lower.includes('1%') && !lower.includes('10%') && !lower.includes('11%')) return 10000;
  return undefined;
}

function extractPoolAddress(text: string): string | undefined {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : undefined;
}

function detectAutoCompound(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes('no compound') || lower.includes('disable compound') || lower.includes('without compound')) return false;
  if (lower.includes('auto compound') || lower.includes('auto-compound') || lower.includes('compound reward') || lower.includes('reinvest')) return true;
  return true;
}

function generateName(text: string, type: AgentType, tokens: { token0?: string; token1?: string }): string {
  const pair = tokens.token0 && tokens.token1 ? ` ${tokens.token0}/${tokens.token1}` : '';
  const typeNames: Record<AgentType, string> = {
    liquidity: 'Liquidity Bot',
    yield: 'Yield Farmer',
    arbitrage: 'Arbitrage Bot',
    sniper: 'Token Sniper',
    rebalancer: 'Portfolio Rebalancer',
    custom: 'Web3 Agent',
  };
  return `${pair.trim()} ${typeNames[type]}`.trim();
}

function generateSystemPrompt(spec: Omit<AgentSpec, 'systemPrompt'>): string {
  const parts: string[] = [];
  parts.push(`You are ${spec.name}, a Web3 DeFi agent operating on ${spec.chain} via ${spec.protocol}.`);
  parts.push(`\nRole: ${spec.description}`);
  parts.push(`\nStrategy: ${spec.agent_type.replace('_', ' ')} with ${spec.risk_level} risk tolerance.`);

  const cfg = spec.config;
  if (cfg.token0 && cfg.token1) parts.push(`\nTarget pair: ${cfg.token0}/${cfg.token1}.`);
  if (cfg.feeTier) parts.push(`Pool fee tier: ${cfg.feeTier} bps.`);
  if (cfg.amount) parts.push(`Position size: ${cfg.amount} USD.`);
  if (cfg.slippageTolerance) parts.push(`Max slippage: ${cfg.slippageTolerance}%.`);
  if (cfg.maxGasPriceGwei) parts.push(`Max gas price: ${cfg.maxGasPriceGwei} Gwei.`);
  if (cfg.stopLossPercent) parts.push(`Stop loss at ${cfg.stopLossPercent}% drawdown.`);
  if (cfg.takeProfitPercent) parts.push(`Take profit at ${cfg.takeProfitPercent}% gain.`);
  if (cfg.rebalanceThreshold) parts.push(`Rebalance when position drifts ${cfg.rebalanceThreshold}%.`);
  if (cfg.targetAPY) parts.push(`Target APY: ${cfg.targetAPY}%.`);
  if (cfg.autoCompound) parts.push(`Auto-compound earned fees back into the position.`);
  if (cfg.poolAddress) parts.push(`Pool address: ${cfg.poolAddress}.`);
  if (cfg.customInstructions) parts.push(`\nAdditional instructions: ${cfg.customInstructions}`);

  parts.push(`\nExecution rules:`);
  parts.push(`- Monitor pool state and market conditions continuously.`);
  parts.push(`- Execute transactions only when parameters are within configured bounds.`);
  parts.push(`- Log all actions and their outcomes for auditability.`);
  parts.push(`- Never exceed the configured risk limits.`);

  return parts.join('\n');
}

export function parseAgentDescription(text: string): AgentSpec {
  const agentType = detectType(text);
  const riskLevel = detectRisk(text);
  const chain = detectChain(text);
  const protocol = detectProtocol(text);
  const tokens = extractTokenPair(text);
  const amount = extractAmount(text);
  const feeTier = extractFeeTier(text);
  const poolAddress = extractPoolAddress(text);
  const autoCompound = detectAutoCompound(text);
  const slippage = extractPercent(text, ['slippage']);
  const stopLoss = extractPercent(text, ['stop loss', 'stop-loss']);
  const takeProfit = extractPercent(text, ['take profit', 'take-profit']);
  const targetAPY = extractPercent(text, ['target apy', 'target apr', 'apy', 'apr']);
  const rebalanceThreshold = extractPercent(text, ['rebalance', 'rebalance threshold', 'threshold']);
  const maxGas = extractPercent(text, ['max gas', 'gas price', 'gas limit']);

  const name = generateName(text, agentType, tokens);

  const typeDescriptions: Record<AgentType, string> = {
    liquidity: 'Provides liquidity to DEX pools and manages positions with configurable ranges',
    yield: 'Seeks and auto-compounds yield opportunities across DeFi protocols',
    arbitrage: 'Monitors price differences across DEXs and executes profitable arbitrage',
    sniper: 'Monitors new token launches and executes early entries',
    rebalancer: 'Maintains target portfolio allocations automatically',
    custom: 'Executes custom Web3 strategies based on user-defined parameters',
  };

  const config: AgentConfig = {
    token0: tokens.token0,
    token1: tokens.token1,
    feeTier,
    amount,
    poolAddress,
    autoCompound,
    slippageTolerance: slippage,
    stopLossPercent: stopLoss,
    takeProfitPercent: takeProfit,
    targetAPY,
    rebalanceThreshold,
    maxGasPriceGwei: maxGas,
  };

  const partialSpec = {
    name,
    description: typeDescriptions[agentType],
    agent_type: agentType,
    protocol,
    chain,
    risk_level: riskLevel,
    config,
  };

  return {
    ...partialSpec,
    systemPrompt: generateSystemPrompt(partialSpec),
  };
}
