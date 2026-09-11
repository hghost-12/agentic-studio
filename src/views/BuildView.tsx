import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SpecCard } from '@/components/SpecCard';
import { parseAgentDescription, type AgentSpec } from '@/lib/agentParser';
import { AGENT_TYPE_META, type AgentType } from '@/types';
import {
  Send, Bot, Sparkles, Droplets, Sprout, ArrowLeftRight,
  Crosshair, Scale, User, AlertCircle, Plus, MessageSquare,
} from 'lucide-react';

const typeIconMap: Record<string, typeof Bot> = {
  Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot,
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  spec?: AgentSpec;
  specStatus?: 'pending' | 'creating' | 'created';
}

interface BuildViewProps {
  onCreateAgent: (spec: AgentSpec) => Promise<void>;
  onAgentCreated: (agentId: string) => void;
}

const SUGGESTIONS = [
  'Create a liquidity provider for ETH/USDC on Uniswap V3 on Arbitrum, 0.3% fee tier, $5000 position, auto-compound rewards, max 5% slippage, 15% stop loss',
  'Build an aggressive yield farmer on Aave, Ethereum, targeting 30% APY with auto-compounding',
  'Make an arbitrage bot monitoring Uniswap and SushiSwap on Base, 0.05% slippage tolerance, 50 Gwei max gas',
  'Create a conservative portfolio rebalancer on Curve, Ethereum, rebalance at 5% drift, 10% stop loss',
];

const TYPE_HINTS: { type: AgentType; label: string; example: string }[] = [
  { type: 'liquidity', label: 'Liquidity Provider', example: 'liquidity, LP, pool, AMM' },
  { type: 'yield', label: 'Yield Farmer', example: 'yield, farm, staking, APY' },
  { type: 'arbitrage', label: 'Arbitrage', example: 'arbitrage, price gap, spread' },
  { type: 'sniper', label: 'Token Sniper', example: 'snipe, new token, launch' },
  { type: 'rebalancer', label: 'Rebalancer', example: 'rebalance, portfolio, allocation' },
];

function generateAssistantReply(spec: AgentSpec, userText: string): string {
  const detected: string[] = [];
  detected.push(spec.agent_type.replace('_', ' '));
  detected.push(spec.chain);
  detected.push(spec.protocol);

  const features: string[] = [];
  if (spec.config.token0 && spec.config.token1) features.push(`${spec.config.token0}/${spec.config.token1} pair`);
  if (spec.config.feeTier) features.push(`${spec.config.feeTier} bps fee tier`);
  if (spec.config.amount) features.push(`$${spec.config.amount} position`);
  if (spec.config.autoCompound) features.push('auto-compounding');
  if (spec.config.slippageTolerance) features.push(`${spec.config.slippageTolerance}% slippage tolerance`);
  if (spec.config.stopLossPercent) features.push(`${spec.config.stopLossPercent}% stop loss`);
  if (spec.config.takeProfitPercent) features.push(`${spec.config.takeProfitPercent}% take profit`);
  if (spec.config.targetAPY) features.push(`${spec.config.targetAPY}% target APY`);
  if (spec.config.rebalanceThreshold) features.push(`${spec.config.rebalanceThreshold}% rebalance threshold`);

  const featuresStr = features.length > 0 ? features.join(', ') : 'basic parameters';

  return `I've analyzed your request and drafted an agent spec. Here's what I understood:\n\n` +
    `**${spec.name}** — a ${detected.join(' / ')} agent with ${spec.risk_level} risk tolerance.\n\n` +
    `Key parameters I extracted: ${featuresStr}.\n\n` +
    `Review the spec card below. If it looks right, hit **Create this agent**. Otherwise, tell me what to change and I'll update the proposal.`;
}

export function BuildView({ onCreateAgent, onAgentCreated }: BuildViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [creatingSpecId, setCreatingSpecId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const spec = parseAgentDescription(text);
      const reply = generateAssistantReply(spec, text);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: reply,
        spec,
        specStatus: 'pending',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setThinking(false);
    }, 800 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreate = async (msgId: string, spec: AgentSpec) => {
    setCreatingSpecId(msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, specStatus: 'creating' } : m))
    );
    try {
      // Mark as created — the actual DB insert happens in App
      // We use a callback that resolves when the agent is saved
      await onCreateAgent(spec);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, specStatus: 'created' } : m))
      );

      // Add confirmation message
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Agent **${spec.name}** has been created and is now in your fleet. You can activate it from the Agents page to start executing tasks.`,
      }]);
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, specStatus: 'pending' } : m))
      );
    } finally {
      setCreatingSpecId(null);
    }
  };

  const handleEdit = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, specStatus: 'pending' } : m))
    );
    inputRef.current?.focus();
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-100">Build an Agent</h2>
            <p className="text-xs text-surface-500">Describe what you want in plain language — I'll draft a spec for your approval</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {empty && (
            <div className="space-y-6 pt-8">
              {/* Welcome */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-600/20 to-secondary-600/20 border border-surface-700/50 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-base font-bold text-surface-100">Describe your Web3 agent</h3>
                <p className="text-sm text-surface-400 mt-1 max-w-md mx-auto">
                  Tell me what kind of agent you need — liquidity provider, yield farmer, arbitrage bot, or something custom.
                  I'll parse your description and show you a spec card to approve.
                </p>
              </div>

              {/* Type hints */}
              <div className="glass-card p-4">
                <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-3">Agent types I recognize</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TYPE_HINTS.map((hint) => {
                    const meta = AGENT_TYPE_META[hint.type];
                    const Icon = typeIconMap[meta.icon] ?? Bot;
                    return (
                      <div key={hint.type} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-800/30 border border-surface-700/30">
                        <Icon className="w-4 h-4 text-primary-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-surface-200">{hint.label}</p>
                          <p className="text-[10px] text-surface-500">{hint.example}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-2">Try one of these</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(s)}
                      className="w-full text-left p-3 rounded-lg bg-surface-900/40 border border-surface-800 hover:border-primary-600/30 hover:bg-surface-800/40 transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <MessageSquare className="w-3.5 h-3.5 text-surface-600 group-hover:text-primary-400 transition-colors shrink-0 mt-0.5" />
                        <p className="text-xs text-surface-400 group-hover:text-surface-300 transition-colors">{s}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* Message bubble */}
              <div className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  msg.role === 'user'
                    ? 'bg-surface-800 text-surface-400'
                    : 'bg-gradient-to-br from-primary-600/20 to-secondary-600/20 text-primary-400 border border-surface-700/50'
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  'rounded-xl px-4 py-3 max-w-[85%]',
                  msg.role === 'user'
                    ? 'bg-surface-800/60 border border-surface-700/50'
                    : 'bg-surface-900/40 border border-surface-800'
                )}>
                  <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{renderText(msg.text)}</p>
                </div>
              </div>

              {/* Spec card (inline after assistant message) */}
              {msg.spec && msg.specStatus !== 'created' && (
                <div className="pl-11">
                  <SpecCard
                    spec={msg.spec}
                    creating={msg.specStatus === 'creating' || creatingSpecId === msg.id}
                    onCreate={() => handleCreate(msg.id, msg.spec!)}
                    onEdit={() => handleEdit(msg.id)}
                  />
                </div>
              )}

              {/* Created confirmation inline */}
              {msg.spec && msg.specStatus === 'created' && (
                <div className="pl-11">
                  <div className="rounded-xl border border-success-500/30 bg-success-500/5 p-4 flex items-center gap-3 animate-slide-up">
                    <div className="w-8 h-8 rounded-lg bg-success-500/15 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-success-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-success-400">Agent created</p>
                      <p className="text-xs text-surface-500">{msg.spec.name} is now in your fleet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600/20 to-secondary-600/20 border border-surface-700/50 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-400" />
              </div>
              <div className="rounded-xl bg-surface-900/40 border border-surface-800 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-surface-800 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your agent… e.g. 'Create a liquidity provider for ETH/USDC on Uniswap V3 on Arbitrum, $5000, auto-compound, 5% slippage'"
              rows={2}
              className="input-field resize-none pr-12 min-h-[60px] max-h-[120px]"
              disabled={thinking}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-surface-600 mt-2 text-center">
            Press Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-surface-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
