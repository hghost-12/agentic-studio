import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { WalletUser, Eip1193Provider, WalletProvider } from '@/types/wallet';
import { CHAIN_NAMES } from '@/types/wallet';

function detectProvider(eth: Eip1193Provider | undefined): WalletProvider {
  if (!eth) return 'unknown';
  if (eth.isMetaMask) return 'metamask';
  if (eth.isCoinbaseWallet) return 'coinbase';
  if (eth.isRabby) return 'rabby';
  return 'unknown';
}

function generateAvatarSeed(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

const STORAGE_KEY = 'agentforge_wallet';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<WalletProvider>('unknown');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<WalletUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const ethRef = useRef<Eip1193Provider | undefined>(undefined);

  // Try reconnect from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      tryReconnect(saved);
    }
  }, []);

  const tryReconnect = async (savedAddress: string) => {
    const eth = window.ethereum;
    if (!eth) return;
    ethRef.current = eth;
    try {
      const accounts = await eth.request({ method: 'eth_accounts' }) as string[];
      if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
        setAddress(accounts[0].toLowerCase());
        setProviderType(detectProvider(eth));
        const chain = await eth.request({ method: 'eth_chainId' }) as string;
        setChainId(chain);
        setupListeners(eth);
        await loadOrCreateUser(accounts[0].toLowerCase());
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const setupListeners = (eth: Eip1193Provider) => {
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0].toLowerCase());
        loadOrCreateUser(accounts[0].toLowerCase());
      }
    };
    const handleChainChanged = (...args: unknown[]) => {
      setChainId(args[0] as string);
    };
    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);
  };

  const loadOrCreateUser = useCallback(async (walletAddress: string) => {
    setUserLoading(true);
    const lowerAddr = walletAddress.toLowerCase();
    const { data: existing } = await supabase
      .from('wallet_users')
      .select('*')
      .eq('wallet_address', lowerAddr)
      .maybeSingle();

    if (existing) {
      await supabase.from('wallet_users').update({ last_seen_at: new Date().toISOString() }).eq('id', existing.id);
      setUser(existing as WalletUser);
    } else {
      const { data: created, error } = await supabase
        .from('wallet_users')
        .insert({
          wallet_address: lowerAddr,
          display_name: null,
          avatar_seed: generateAvatarSeed(lowerAddr),
        })
        .select()
        .single();
      if (error) {
        console.error('Failed to create wallet user:', error.message);
      } else {
        setUser(created as WalletUser);
      }
    }
    setUserLoading(false);
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setError('No wallet found. Please install MetaMask or another browser wallet extension.');
      return;
    }
    ethRef.current = eth;
    setConnecting(true);
    setError(null);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length === 0) {
        setError('No accounts returned. Please unlock your wallet and try again.');
        setConnecting(false);
        return;
      }
      const lowerAddr = accounts[0].toLowerCase();
      setAddress(lowerAddr);
      setProviderType(detectProvider(eth));
      const chain = await eth.request({ method: 'eth_chainId' }) as string;
      setChainId(chain);
      setupListeners(eth);
      sessionStorage.setItem(STORAGE_KEY, lowerAddr);
      await loadOrCreateUser(lowerAddr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(msg.includes('rejected') ? 'Connection rejected. Please try again.' : msg);
    } finally {
      setConnecting(false);
    }
  }, [loadOrCreateUser]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setUser(null);
    setProviderType('unknown');
    setError(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchChain = useCallback(async (targetChainId: string) => {
    const eth = ethRef.current;
    if (!eth) return;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChainId }] });
    } catch (err) {
      console.error('Failed to switch chain:', err);
    }
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('wallet_users')
      .update({ display_name: displayName })
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setUser(data as WalletUser);
  }, [user]);

  const chainName = chainId ? CHAIN_NAMES[chainId] ?? `Chain ${parseInt(chainId, 16)}` : null;

  return {
    address,
    chainId,
    chainName,
    providerType,
    connected: !!address,
    connecting,
    error,
    user,
    userLoading,
    connect,
    disconnect,
    switchChain,
    updateProfile,
    clearError: () => setError(null),
  };
}
