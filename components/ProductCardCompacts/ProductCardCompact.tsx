import React from 'react';
import { Package, Tag, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Product } from '../item-produts/product';
import { formatKwanza } from '@/lib/currency';


interface ProductCardCompactProps {
  product: Product;
  categories?: Map<string, string>;
  isSelected?: boolean;
  onSelect?: () => void;
  onAction?: () => void;
}

const ProductCardCompact: React.FC<ProductCardCompactProps> = ({
  product,
  categories,
  isSelected,
  onSelect,
  onAction,
}) => {
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCategoryName = () => {
    if (categories && categories.has(product.categoryId)) {
      return categories.get(product.categoryId);
    }
    return `Cat: ${product.categoryId.substring(0, 6)}...`;
  };

  return (
    <div className={`
      flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
      ${isSelected ? 'bg-blue-50 border-blue-300' : ''}
    `}>
      {/* Checkbox para seleção */}
      {onSelect && (
        <div className="mr-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </div>
      )}

      {/* Ícone de status */}
      <div className="mr-3">
        {product.status === 'active' ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Imagem */}
      <div className="relative w-12 h-12 mr-3 rounded overflow-hidden bg-gray-100 flex-shrink-0">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <Package className="w-6 h-6 text-gray-400 m-auto" />
        )}
      </div>

      {/* Informações principais */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-900 truncate text-sm">
            {product.name}
          </h4>
          <span className="font-semibold text-gray-900 text-sm ml-2">
            {formatKwanza(product.price)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{getCategoryName()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span className={`font-medium ${getStockColor(product.stock)}`}>
              {product.stock} un
            </span>
          </div>

          {product.sku && (
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {product.sku}
            </span>
          )}
        </div>
      </div>

      {/* Botão de ações */}
      {onAction && (
        <button
          onClick={onAction}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ProductCardCompact;