import { FornecedoresPageClient } from '@/components/fornecedores/FornecedoresPageClient';

export default function FornecedoresPage() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-w-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Fornecedores</h1>
        <p className="text-gray-500 text-sm mb-8">Cadastrar e gerir parceiros / fornecedores</p>
        <FornecedoresPageClient />
      </div>
    </main>
  );
}
