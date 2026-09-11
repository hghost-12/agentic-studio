import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { WalletAvatar } from '@/components/WalletAvatar';
import type { WalletUser } from '@/types/wallet';
import { shortAddress } from '@/lib/utils';
import { ChevronDown, Copy, Check, Pencil, LogOut, Wallet, ExternalLink } from 'lucide-react';

interface WalletButtonProps {
  address: string;
  chainName: string | null;
  user: WalletUser | null;
  userLoading: boolean;
  onDisconnect: () => void;
  onUpdateProfile: (name: string) => Promise<void>;
}

export function WalletButton({ address, chainName, user, userLoading, onDisconnect, onUpdateProfile }: WalletButtonProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.display_name ?? '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setName(user?.display_name ?? '');
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await onUpdateProfile(name.trim());
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.display_name || `Wallet ${shortAddress(address)}`;
  const avatarSeed = user?.avatar_seed ?? address;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl bg-surface-800/60 border border-surface-700/50 hover:bg-surface-800 hover:border-surface-600/50 transition-all"
      >
        <WalletAvatar seed={avatarSeed} address={address} size={28} />
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-surface-200 leading-tight max-w-[100px] truncate">{displayName}</p>
          <p className="text-[10px] text-surface-500 leading-tight">{shortAddress(address)}</p>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-surface-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl glass border border-surface-700 shadow-2xl shadow-surface-950/50 overflow-hidden z-50 animate-slide-up">
          {/* Profile header */}
          <div className="p-4 border-b border-surface-800">
            <div className="flex items-center gap-3 mb-3">
              <WalletAvatar seed={avatarSeed} address={address} size={44} />
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      placeholder="Display name"
                      maxLength={30}
                      className="input-field text-xs py-1.5 px-2"
                    />
                    <button onClick={handleSaveName} disabled={saving || !name.trim()} className="btn-primary text-xs px-2.5 py-1.5 shrink-0">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-surface-100 truncate">
                      {userLoading ? 'Loading…' : displayName}
                    </p>
                    <p className="text-[10px] text-surface-500">{chainName}</p>
                  </>
                )}
              </div>
            </div>

            {/* Wallet address row */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-900/60 border border-surface-700/40">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                <code className="text-xs font-mono text-surface-300 truncate">{shortAddress(address)}</code>
              </div>
              <button onClick={handleCopy} className="btn-ghost p-1.5 shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:bg-surface-800/60 transition-colors"
              >
                <Pencil className="w-4 h-4 text-surface-500" />
                Edit display name
              </button>
            )}
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-surface-300 hover:bg-surface-800/60 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-surface-500" />
              View on Etherscan
            </a>
            <button
              onClick={() => { onDisconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-error-400 hover:bg-error-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
