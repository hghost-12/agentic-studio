import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Bot, ListTodo, Activity, Settings, Sparkles,
  Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot as BotIcon,
} from 'lucide-react';
import { WalletButton } from '@/components/WalletButton';
import type { WalletUser } from '@/types/wallet';

export type View = 'dashboard' | 'build' | 'agents' | 'tasks' | 'activity' | 'settings';

interface SidebarProps {
  current: View;
  onNavigate: (view: View) => void;
  agentCount: number;
  activeAgentCount: number;
  walletAddress: string;
  walletChainName: string | null;
  walletUser: WalletUser | null;
  walletUserLoading: boolean;
  onDisconnect: () => void;
  onUpdateProfile: (name: string) => Promise<void>;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'build', label: 'Build Agent', icon: Sparkles },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const agentTypeIcons: Record<string, typeof BotIcon> = {
  Droplets, Sprout, ArrowLeftRight, Crosshair, Scale, Bot: BotIcon,
};

export { agentTypeIcons };

export function Sidebar({
  current, onNavigate, agentCount, activeAgentCount,
  walletAddress, walletChainName, walletUser, walletUserLoading,
  onDisconnect, onUpdateProfile,
}: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-surface-800 bg-surface-900/50 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-100 tracking-tight">AgentForge</h1>
            <p className="text-[10px] text-surface-500 font-medium">Web3 Agent Studio</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary-600/15 text-primary-400 border border-primary-600/20'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/60 border border-transparent'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', active && 'text-primary-400')} />
              {item.label}
              {item.id === 'agents' && agentCount > 0 && (
                <span className={cn(
                  'ml-auto text-xs px-2 py-0.5 rounded-full font-semibold',
                  active ? 'bg-primary-600/20 text-primary-400' : 'bg-surface-800 text-surface-400'
                )}>
                  {agentCount}
                </span>
              )}
              {item.id === 'dashboard' && activeAgentCount > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-success-400 font-semibold">
                  <span className="status-dot bg-success-400 animate-pulse" />
                  {activeAgentCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: network status + wallet */}
      <div className="px-3 py-4 border-t border-surface-800 space-y-3">
        <div className="px-3 py-2.5 rounded-lg bg-surface-800/50 border border-surface-700/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot bg-success-400 animate-pulse" />
            <span className="text-xs font-medium text-surface-300">{walletChainName ?? 'No chain'}</span>
          </div>
          <p className="text-[10px] text-surface-500">Wallet connected</p>
        </div>
        <WalletButton
          address={walletAddress}
          chainName={walletChainName}
          user={walletUser}
          userLoading={walletUserLoading}
          onDisconnect={onDisconnect}
          onUpdateProfile={onUpdateProfile}
        />
      </div>
    </aside>
  );
}
