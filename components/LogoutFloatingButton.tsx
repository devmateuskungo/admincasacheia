
'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoutFloatingButton() {
  return (
    <Link
      href="/auth/logout"
      className={cn(
        'fixed bottom-5 right-5 z-1100 flex h-12 w-12 items-center justify-center rounded-full',
        'bg-[#ED5379] text-white shadow-lg shadow-[#ED5379]/30',
        'transition-transform hover:scale-105 hover:bg-[#ED5379]/90 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5379] focus-visible:ring-offset-2'
      )}
      title="Sair da conta"
      aria-label="Sair da conta"
    >
      <LogOut className="h-5 w-5" strokeWidth={2.25} />
    </Link>
  );
}
