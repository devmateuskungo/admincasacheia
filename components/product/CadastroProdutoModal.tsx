'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ImageUploadModal } from './ImageUploadModal';
import { Package, DollarSign, Tag, Hash, FileText, Upload, X, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BASE_URL,
  buildProductFormData,
  getErrorMessageFromResponse,
  sanitizeBearerToken,
} from '@/lib/api';
import { extractPartnersList } from '@/components/fornecedores/types';

export interface CategoryOption {
  _id: string;
  name: string;
}

export interface PartnerOption {
  _id: string;
  name: string;
}

interface CadastroProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  onSuccess?: () => void;
}

export function CadastroProdutoModal({
  open,
  onOpenChange,
  categories: categoriesProp,
  onSuccess,
}: CadastroProdutoModalProps) {
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesProp);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [partner, setPartner] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar categorias e fornecedores ao abrir o modal
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = raw ? sanitizeBearerToken(raw) : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.categories) setCategories(data.categories);
      })
      .catch(() => {});

    fetch(`${BASE_URL}/partners`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const list = extractPartnersList(data);
          setPartners(list.map((p) => ({ _id: p._id, name: p.name })));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open]);

  const resetForm = () => {
    setName('');
    setPrice(0);
    setCategory('');
    setPartner('');
    setStock(0);
    setDescription('');
    setImageFiles([]);
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    setImagePreviews([]);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleImageConfirm = (files: File[]) => {
    setImageFiles(files);
    setImagePreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return files.map((f) => URL.createObjectURL(f));
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nome do produto é obrigatório.');
      return;
    }
    if (!category) {
      setError('Selecione uma categoria.');
      return;
    }
    if (!partner) {
      setError('Selecione um fornecedor.');
      return;
    }
    if (imageFiles.length === 0) {
      setError('Precisa carregar pelo menos uma imagem para o produto.');
      return;
    }

    setLoading(true);
    try {
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = rawToken ? sanitizeBearerToken(rawToken) : null;
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Pedido em multipart/form-data (não JSON). Não definir Content-Type — o browser envia o boundary.
      const formData = buildProductFormData({
        name: name.trim(),
        price: Number(price),
        category,
        partner,
        stock: Number(stock),
        description: description.trim(),
        imageFiles: imageFiles,
      });

      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        throw new Error(msg || `Erro ${res.status}`);
      }

      resetForm();
      handleClose(false);
      onSuccess?.();
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={cn('sm:max-w-xl max-h-[90vh] overflow-y-auto')} showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Cadastrar produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-2" />
                Nome do produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="Ex: Pimenta-do-reino"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Preço (Kz) *
                </label>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  required
                  min={0}
                  step={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Estoque *
                </label>
                <input
                  type="number"
                  value={stock || ''}
                  onChange={(e) => setStock(Number(e.target.value) || 0)}
                  required
                  min={0}
                  step={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-2" />
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Handshake className="w-4 h-4 inline mr-2" />
                Fornecedor *
              </label>
              <select
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              >
                <option value="">Selecione um fornecedor</option>
                {partners.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-2" />
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="Descrição detalhada do produto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Upload className="w-4 h-4 inline mr-2" />
                Imagens *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Obrigatório pelo menos uma imagem. Pode selecionar várias no mesmo diálogo (até 8).
              </p>
              <button
                type="button"
                onClick={() => setImageModalOpen(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-[#ED5379] hover:bg-[#ED5379]/5 hover:text-[#ED5379] transition-colors"
              >
                <Upload className="w-5 h-5" />
                {imageFiles.length > 0
                  ? `${imageFiles.length} imagem(ns) selecionada(s)`
                  : 'Adicionar imagens (clique para abrir)'}
              </button>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <Image
                        src={src}
                        alt={`Preview ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#ED5379] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'A guardar...' : 'Cadastrar produto'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageUploadModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        currentFiles={imageFiles}
        onConfirm={handleImageConfirm}
      />
    </>
  );
}
