import { CategoriasPageClient } from '@/components/categorias/CategoriasPageClient';

export default function CategoriasPage() {
  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Categorias
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Gerir categorias dos produtos
        </p>
        <CategoriasPageClient />
      </div>
    </main>
  );
}
