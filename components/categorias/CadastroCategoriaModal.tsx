'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tag, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api';

interface CadastroCategoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CadastroCategoriaModal({
  open,
  onOpenChange,
  onSuccess,
}: CadastroCategoriaModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nome da categoria é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Erro ${res.status}`);
      }
      reset();
      handleClose(false);
      onSuccess?.();
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('sm:max-w-md')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Cadastrar categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="w-4 h-4 inline mr-2" />
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              placeholder="Ex: Bebidas"
            />
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
              placeholder="Ex: Produtos bebíveis"
            />
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
              {loading ? 'A guardar...' : 'Cadastrar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
