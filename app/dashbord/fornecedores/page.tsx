import { FornecedoresPageClient } from '@/components/fornecedores/FornecedoresPageClient';

export default function FornecedoresPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <p className="text-gray-500">
          Cadastre e gerencie os seus parceiros e fornecedores.
        </p>
      </header>
      <FornecedoresPageClient />
    </div>
  );
}