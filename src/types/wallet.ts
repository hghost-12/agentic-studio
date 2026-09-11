export interface WalletUser {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_seed: string;
  created_at: string;
  last_seen_at: string;
}

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export type WalletProvider = 'metamask' | 'coinbase' | 'rabby' | 'unknown';

export interface WalletState {
  address: string | null;
  chainId: string | null;
  provider: WalletProvider;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export const CHAIN_NAMES: Record<string, string> = {
  '0x1': 'Ethereum',
  '0xa4b1': 'Arbitrum',
  '0x2105': 'Base',
  '0xa': 'Optimism',
  '0x89': 'Polygon',
  '0x38': 'BSC',
};
