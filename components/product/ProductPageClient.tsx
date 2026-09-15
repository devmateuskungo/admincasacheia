'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

type StockFilter = 'all' | 'in' | 'low' | 'out';

function categoryLabel(cat: Product['category'] | undefined): string {
  if (cat == null || cat === '') return '';
  if (typeof cat === 'object' && cat !== null && 'name' in cat) return cat.name ?? '';
  return String(cat);
}

function getPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '...')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('...');
    out.push(p);
    prev = p;
  }
  return out;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Sincronizar com props quando a página mudar (ex.: navegação ou refresh do servidor)
  useEffect(() => {
    setProductsList(products ?? []);
    setPageInfoState(pageInfo);
  }, [products, pageInfo]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productsList.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === 'all' ||
        categoryLabel(p.category) === categoryFilter ||
        (typeof p.category !== 'object' && String(p.category ?? '') === categoryFilter);
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in' && p.stock > 10) ||
        (stockFilter === 'low' && p.stock > 0 && p.stock <= 10) ||
        (stockFilter === 'out' && p.stock === 0);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [productsList, searchQuery, categoryFilter, stockFilter]);

  const stockSummary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outStock = 0;
    for (const p of productsList) {
      if (p.stock === 0) outStock += 1;
      else if (p.stock <= 10) lowStock += 1;
      else inStock += 1;
    }
    return { inStock, lowStock, outStock };
  }, [productsList]);

  const statCards = [
    {
      label: 'Total de Produtos',
      value: pageInfoState.totalProducts,
      icon: Package,
      tint: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Em Stock',
      value: stockSummary.inStock,
      icon: Boxes,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Stock Baixo',
      value: stockSummary.lowStock,
      icon: AlertTriangle,
      tint: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Esgotados',
      value: stockSummary.outStock,
      icon: XCircle,
      tint: 'bg-red-50 text-red-600',
    },
  ];

  const hasFilters = searchQuery !== '' || categoryFilter !== 'all' || stockFilter !== 'all';

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
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.tint)}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar produto ou categoria..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative sm:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative sm:w-40">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            >
              <option value="all">Todo o stock</option>
              <option value="in">Em stock</option>
              <option value="low">Stock baixo</option>
              <option value="out">Esgotado</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="text-sm text-gray-500">
            {filteredProducts.length} de {productsList.length} desta página
          </span>
          <Button
            onClick={() => setCadastroOpen(true)}
            className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Cadastrar produto
          </Button>
        </div>
      </div>

      {/* Lista de produtos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={(p) => setEditingProduct(p)}
              onView={(p) => setProductToViewId(p._id)}
              onDeleteRequest={(p) => setProductToDelete(p)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">
            {hasFilters ? 'Nenhum resultado para os filtros' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {hasFilters
              ? 'Tente ajustar a pesquisa ou os filtros selecionados.'
              : 'Comece por cadastrar o primeiro produto do catálogo.'}
          </p>
          {hasFilters ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStockFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54]"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </button>
          ) : (
            <button
              onClick={() => setCadastroOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54]"
            >
              <Plus className="h-4 w-4" />
              Cadastrar produto
            </button>
          )}
        </div>
      )}

      {/* Paginação */}
      {pageInfoState.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <Link
            href={`/dashbord/product?page=${pageInfoState.current > 1 ? pageInfoState.current - 1 : 1}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
              pageInfoState.current <= 1
                ? 'pointer-events-none bg-gray-100 text-gray-400'
                : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300'
            )}
            aria-disabled={pageInfoState.current <= 1}
          >
            <ChevronLeft size={16} />
            Anterior
          </Link>

          <div className="flex items-center gap-1.5">
            {getPageList(pageInfoState.current, pageInfoState.totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-sm text-gray-400">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={`/dashbord/product?page=${p}`}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all',
                    p === pageInfoState.current
                      ? 'bg-[#ED5379] text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {p}
                </Link>
              )
            )}
          </div>

          <Link
            href={`/dashbord/product?page=${pageInfoState.current < pageInfoState.totalPages ? pageInfoState.current + 1 : pageInfoState.totalPages}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
              pageInfoState.current >= pageInfoState.totalPages
                ? 'pointer-events-none bg-gray-100 text-gray-400'
                : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300'
            )}
            aria-disabled={pageInfoState.current >= pageInfoState.totalPages}
          >
            Próximo
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

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