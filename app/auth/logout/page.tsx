'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

/**
 * Limpa dados de sessão no browser e envia para o login.
 * O token é só em localStorage; não há cookie HttpOnly neste painel.
 */
export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <Image src="/logo.png" alt="Casa Cheia" width={56} height={56} className="h-14 w-14 object-contain" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-[#ED5379]" aria-hidden />
        <p>A sair da sessão…</p>
      </div>
    </div>
  );
}
