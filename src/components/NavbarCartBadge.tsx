import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../lib/cartStore';

export const NavbarCartBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { itemCount } = useCart();

  return (
    <a
      href="/cart"
      aria-label={`Shopping Cart (${itemCount} items)`}
      className={
        compact
          ? 'relative p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center shrink-0 transition-colors'
          : 'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0'
      }
    >
      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
      {!compact && <span>Cart</span>}
      {itemCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[2px] bg-white text-black font-mono text-[10px] font-bold tabular-nums">
          {itemCount}
        </span>
      )}
    </a>
  );
};

export default NavbarCartBadge;
