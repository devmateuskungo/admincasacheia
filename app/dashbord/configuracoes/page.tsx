import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient';

export default function ConfiguracoesPage() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configurações
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Sessão do utilizador, localização da empresa e gestão de banners
        </p>
        <ConfiguracoesClient />
      </div>
    </main>
  );
}
