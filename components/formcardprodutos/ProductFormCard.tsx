'use client';

import React, { useState } from 'react';
import { Save, X, Upload, Package, Tag, DollarSign, Hash, FileText } from 'lucide-react';
import Image from 'next/image';
import { Product } from '../item-produts/product';


interface ProductFormCardProps {
  product?: Product;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ProductFormCard: React.FC<ProductFormCardProps> = ({
  product,
  categories,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    price: product?.price || 0,
    categoryId: product?.categoryId || categories[0]?.id || '',
    stock: product?.stock || 0,
    description: product?.description || '',

  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product?.images || []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);

    // Criar previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#ED5379] text-white hover:bg-[#ED5379] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna esquerda - Informações básicas */}
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-2" />
                Nome do Produto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="Digite o nome do produto"
              />
            </div>

            {/* Preço e Estoque */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Preço (Kz) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Estoque *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>
            </div>

            {/* Categoria e SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Categoria *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  SKU (Código)
                </label>
                <input
                  type="text"
                  name="sku"
               
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                  placeholder="Ex: PROD-001"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
               
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          {/* Coluna direita - Descrição e Imagens */}
          <div className="space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="Descreva o produto detalhadamente..."
              />
            </div>

            {/* Upload de Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Imagens do Produto
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="w-full mb-4"
                />
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-24 rounded overflow-hidden">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Máximo 5 imagens. Formatos suportados: JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductFormCard;