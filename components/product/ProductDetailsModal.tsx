'use client';

import React, { startTransition, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, DollarSign, Tag, Hash, FileText } from 'lucide-react';
import { cn, productImageList } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';
import { formatKwanza } from '@/lib/currency';

export interface ProductDetails {
  _id: string;
  name: string;
  price: number;
  category?: string | { _id: string; name: string };
  stock: number;
  images?: string[];
  image?: string[];
  description?: string;
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

function isProductShape(x: unknown): x is ProductDetails {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r._id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.price === 'number' &&
    typeof r.stock === 'number'
  );
}

/** GET /products/:id — resposta pode ser `{ data }`, `{ product }` ou o próprio documento. */
function productFromGetResponse(body: unknown): ProductDetails | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const wrapped = o.data ?? o.product;
  if (isProductShape(wrapped)) return wrapped;
  if (isProductShape(o)) return o;
  return null;
}

export function ProductDetailsModal({
  open,
  onOpenChange,
  productId,
}: ProductDetailsModalProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !productId) {
      startTransition(() => {
        setProduct(null);
        setError(null);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setProduct(null);
      try {
        const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(productId)}`);
        if (!res.ok) throw new Error('Produto não encontrado');
        const data = await res.json();
        const p = productFromGetResponse(data);
        if (!p) throw new Error('Produto não encontrado');
        if (!cancelled) setProduct(p);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes');
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  const categoryName =
    product?.category == null
      ? ''
      : typeof product.category === 'object' && product.category !== null && 'name' in product.category
        ? (product.category as { name: string }).name
        : String(product?.category ?? '');

  const detailImgs = product ? productImageList(product) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Detalhes do produto</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-10 h-10 border-2 border-[#ED5379] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">A carregar...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && product && (
          <div className="space-y-4">
            {detailImgs.length > 0 ? (
              <div className="relative aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={detailImgs[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl text-gray-400">
                <Package size={48} className="mb-2 opacity-50" />
                <span className="text-sm">Sem imagem</span>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              {categoryName && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {categoryName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-5 h-5 text-[#ED5379]" />
                <div>
                  <p className="text-xs text-gray-500">Preço</p>
                  <p className="font-semibold">{formatKwanza(product.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Hash className="w-5 h-5 text-[#ED5379]" />
                <div>
                  <p className="text-xs text-gray-500">Estoque</p>
                  <p className="font-semibold">{product.stock} unidades</p>
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Descrição
                </p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                  {product.description}
                </p>
              </div>
            )}

            {detailImgs.length > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Mais imagens</p>
                <div className="grid grid-cols-4 gap-2">
                  {detailImgs.slice(1, 5).map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
