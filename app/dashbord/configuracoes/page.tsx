import { ConfiguracoesClient } from '@/components/configuracoes/ConfiguracoesClient';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-500">
          Configure o perfil do utilizador, a localização da empresa e os banners da loja.
        </p>
      </header>
      <ConfiguracoesClient />
    </div>
  );
}