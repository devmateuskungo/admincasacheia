'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-[#ED5379]" aria-hidden />
      <p>A sair da sessão…</p>
    </div>
  );
}
