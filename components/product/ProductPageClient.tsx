'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import ProductCard from '@/components/item-produts/itemproduct';
import { CadastroProdutoModal, type CategoryOption } from './CadastroProdutoModal';
import { EditarProdutoModal } from './EditarProdutoModal';
import { ProductDetailsModal } from './ProductDetailsModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { BASE_URL, sanitizeBearerToken } from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
  image?: string[];
  description: string;
  category?: string | { _id: string; name: string };
  partner?: string | { _id: string; name?: string };
}

interface ProductPageClientProps {
  products: Product[];
  pageInfo: { current: number; totalPages: number; totalProducts: number };
  categories: CategoryOption[];
}

export function ProductPageClient({
  products,
  pageInfo,
  categories,
}: ProductPageClientProps) {
  const [productsList, setProductsList] = useState<Product[]>(products ?? []);
  const [pageInfoState, setPageInfoState] = useState(pageInfo);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToViewId, setProductToViewId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sincronizar com props quando a página mudar (ex.: navegação ou refresh do servidor)
  useEffect(() => {
    setProductsList(products ?? []);
    setPageInfoState(pageInfo);
  }, [products, pageInfo]);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = raw ? sanitizeBearerToken(raw) : null;
    if (!token) {
      setProductToDelete(null);
      return;
    }
    const idToDelete = productToDelete._id;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/products/${idToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProductToDelete(null);
        setProductsList((prev) => prev.filter((p) => p._id !== idToDelete));
        setPageInfoState((prev) => ({
          ...prev,
          totalProducts: Math.max(0, prev.totalProducts - 1),
        }));
      }
    } catch {
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {pageInfoState.totalProducts} produto{pageInfoState.totalProducts !== 1 ? 's' : ''}
            </span>
            <span className="text-sm text-gray-400">
              Página {pageInfoState.current} de {pageInfoState.totalPages}
            </span>
          </div>
          <Button
            onClick={() => setCadastroOpen(true)}
            className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Cadastrar produto
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsList.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={(p) => setEditingProduct(p)}
              onView={(p) => setProductToViewId(p._id)}
              onDeleteRequest={(p) => setProductToDelete(p)}
            />
          ))}
        </div>

        {pageInfoState.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 mb-8">
            <Link
              href={`/dashbord/product?page=${pageInfoState.current > 1 ? pageInfoState.current - 1 : 1}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pageInfoState.current <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
              }`}
              aria-disabled={pageInfoState.current <= 1}
            >
              <ChevronLeft size={18} />
              Anterior
            </Link>
            <span className="px-4 py-2 text-sm text-gray-600 font-medium">
              {pageInfoState.current} / {pageInfoState.totalPages}
            </span>
            <Link
              href={`/dashbord/product?page=${pageInfoState.current < pageInfoState.totalPages ? pageInfoState.current + 1 : pageInfoState.totalPages}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pageInfoState.current >= pageInfoState.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
              }`}
              aria-disabled={pageInfoState.current >= pageInfoState.totalPages}
            >
              Próximo
              <ChevronRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <CadastroProdutoModal
        open={cadastroOpen}
        onOpenChange={setCadastroOpen}
        categories={categories}
        onSuccess={() => setCadastroOpen(false)}
      />

      <EditarProdutoModal
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        product={editingProduct}
        categories={categories}
        onSuccess={() => setEditingProduct(null)}
      />

      <ProductDetailsModal
        open={!!productToViewId}
        onOpenChange={(open) => !open && setProductToViewId(null)}
        productId={productToViewId}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-5 h-5" />
              </span>
              Eliminar produto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{productToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
