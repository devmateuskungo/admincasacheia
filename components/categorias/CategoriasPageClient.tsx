'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CadastroCategoriaModal } from './CadastroCategoriaModal';
import { EditarCategoriaModal, type CategoryToEdit } from './EditarCategoriaModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BASE_URL } from '@/lib/api';

const API_BASE = `${BASE_URL}/categories`;

export interface Category {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function CategoriasPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryToEdit | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `${API_BASE}?search=${encodeURIComponent(search.trim())}`
        : API_BASE;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchCategories(), 300);
    return () => clearTimeout(t);
  }, [fetchCategories]);

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setCategoryToDelete(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCategoryToDelete(null);
        window.location.reload();
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379] text-sm"
            />
          </div>
          <Button
            onClick={() => setCadastroOpen(true)}
            className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Cadastrar categoria
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-10 h-10 border-2 border-[#ED5379] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">A carregar categorias...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma categoria encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente outro termo de busca.' : 'Cadastre a primeira categoria.'}
            </p>
            {!search && (
              <Button
                onClick={() => setCadastroOpen(true)}
                className="mt-4 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white"
              >
                Cadastrar categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                      Nome
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">
                      Descrição
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 w-28">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm hidden sm:table-cell max-w-xs truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ _id: cat._id, name: cat.name, description: cat.description })}
                            className="p-2 rounded-lg text-gray-500 hover:text-[#ED5379] hover:bg-[#ED5379]/10 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            {categories.length} categoria{categories.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <CadastroCategoriaModal
        open={cadastroOpen}
        onOpenChange={setCadastroOpen}
        onSuccess={() => setCadastroOpen(false)}
      />

      <EditarCategoriaModal
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        category={editingCategory}
        onSuccess={() => setEditingCategory(null)}
      />

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-5 h-5" />
              </span>
              Eliminar categoria
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{categoryToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCategoryToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
