"use client"
import Image from 'next/image';
import { Edit, Trash2, Eye, Package, Tag } from 'lucide-react';
import { useState } from 'react';
import { productImageList } from '@/lib/utils';
import { formatKwanza } from '@/lib/currency';

export type ProductCategoryField = string | { _id: string; name: string };

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
  image?: string[];
  description: string;
  category?: ProductCategoryField;
  discount?: number;
}

function categoryLabel(cat: ProductCategoryField | undefined): string {
  if (cat == null) return '';
  if (typeof cat === 'object' && cat !== null && 'name' in cat) return cat.name;
  return String(cat);
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDeleteRequest?: (product: Product) => void;
  onView?: (product: Product) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onDeleteRequest,
  onView,
  showActions = true,
  compact = false
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const calculateDiscountedPrice = () => {
    if (product.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return null;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest?.(product);
  };

  const handleView = () => {
    onView?.(product);
  };

  const discountedPrice = calculateDiscountedPrice();
  const isLowStock = product.stock <= 10 && product.stock > 0;
  const isOutOfStock = product.stock === 0;
  const categoryText = categoryLabel(product.category);
  const imgs = productImageList(product);

  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center p-2.5 gap-3 cursor-pointer group"
        onClick={handleView}
      >
        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
          {imgs.length > 0 && !imageError ? (
            <Image
              src={imgs[0]}
              alt={product.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="48px"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-400">
              <Package size={16} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-1 hover:bg-gray-100 rounded text-blue-500 transition-colors"
                  title="Editar"
                >
                  <Edit size={14} />
                </button>
              )}
              {onDeleteRequest && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1 hover:bg-gray-100 rounded text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`font-semibold text-sm ${discountedPrice ? 'text-red-500' : 'text-gray-900'}`}>
              {discountedPrice ? formatKwanza(discountedPrice) : formatKwanza(product.price)}
            </span>
            {discountedPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatKwanza(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              isOutOfStock 
                ? 'bg-red-50 text-red-600' 
                : isLowStock
                ? 'bg-yellow-50 text-yellow-600'
                : 'bg-green-50 text-green-600'
            }`}>
              {isOutOfStock ? 'Sem stock' : `${product.stock} un`}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                -{product.discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex flex-col relative group overflow-hidden"
      onClick={handleView}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.discount && product.discount > 0 && (
          <span className="bg-[#ED5379] text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <Tag size={10} />
            -{product.discount}%
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1 rounded-lg w-fit">
            Esgotado
          </span>
        )}
      </div>

      {/* Ações */}
      {showActions && (onEdit || onDeleteRequest || onView) && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); handleView(); }}
              className="bg-white/95 backdrop-blur p-2 rounded-xl text-gray-600 hover:text-[#ED5379] hover:bg-white shadow-md border border-gray-100 transition-all"
              title="Ver detalhes"
            >
              <Eye size={18} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="bg-white/95 backdrop-blur p-2 rounded-xl text-gray-600 hover:text-[#ED5379] hover:bg-white shadow-md border border-gray-100 transition-all"
              title="Editar produto"
            >
              <Edit size={18} />
            </button>
          )}
          {onDeleteRequest && (
            <button
              onClick={handleDeleteClick}
              className="bg-white/95 backdrop-blur p-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-white shadow-md border border-gray-100 transition-all"
              title="Eliminar produto"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}

      {/* Imagem */}
      <div className="relative h-44 bg-gray-50 overflow-hidden rounded-t-2xl">
        {imgs.length > 0 && !imageError ? (
          <Image
            src={imgs[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Package size={40} className="mb-2 opacity-40" />
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-base mb-1 group-hover:text-[#ED5379] transition-colors">
          {product.name}
        </h3>
        {categoryText ? (
          <p className="text-xs text-gray-500 truncate mb-3">
            {categoryText}
          </p>
        ) : null}

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-xl font-bold ${discountedPrice ? 'text-[#ED5379]' : 'text-gray-900'}`}>
            {discountedPrice ? formatKwanza(discountedPrice) : formatKwanza(product.price)}
          </span>
          {discountedPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatKwanza(product.price)}
            </span>
          )}
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 flex-1 leading-snug mb-4">
          {product.description || '—'}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isOutOfStock ? 'bg-red-50 text-red-600' : isLowStock ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isOutOfStock ? 'Sem stock' : `${product.stock} un.`}
          </span>
          {isLowStock && !isOutOfStock && (
            <span className="text-xs text-amber-600 font-medium">Stock baixo</span>
          )}
        </div>
      </div>
    </div>
  );
}