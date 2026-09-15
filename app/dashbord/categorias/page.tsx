import { CategoriasPageClient } from '@/components/categorias/CategoriasPageClient';

export default function CategoriasPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-gray-500">
          Organize o catálogo da loja: cadastre e edite as categorias dos seus produtos.
        </p>
      </header>
      <CategoriasPageClient />
    </div>
  );
}