import { cn } from '@/lib/utils';

interface WalletAvatarProps {
  seed: string;
  address: string;
  size?: number;
  className?: string;
}

export function WalletAvatar({ seed, address, size = 36, className }: WalletAvatarProps) {
  // Generate two hues from the seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40 + (Math.abs(hash) % 60)) % 360;

  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `linear-gradient(135deg, hsl(${h1}, 65%, 45%), hsl(${h2}, 65%, 35%))`,
      }}
    >
      {initials}
    </div>
  );
}
