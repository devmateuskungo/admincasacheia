'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Tag, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';

const API_BASE = `${BASE_URL}/categories`;

export interface Category {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function isCategoryActive(status: Category['status']): boolean {
  if (status == null) return true;
  if (typeof status === 'boolean') return status;
  return !['inactive', 'inativo', 'inactivo', '0', 'false'].includes(String(status).toLowerCase());
}

function formatDate(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CATEGORY_TINTS = [
  'bg-blue-50 text-blue-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-violet-50 text-violet-600',
  'bg-rose-50 text-rose-600',
  'bg-cyan-50 text-cyan-600',
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_TINTS[hash % CATEGORY_TINTS.length];
}

export function CategoriasPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryToEdit | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError('Erro ao carregar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchCategories(), 300);
    return () => clearTimeout(t);
  }, [fetchCategories]);

  const activeCount = categories.filter((c) => isCategoryActive(c.status)).length;
  const inactiveCount = categories.length - activeCount;

  const statCards = [
    {
      label: 'Total',
      value: categories.length,
      icon: Tag,
      tint: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Ativas',
      value: activeCount,
      icon: CheckCircle2,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Inativas',
      value: inactiveCount,
      icon: XCircle,
      tint: 'bg-amber-50 text-amber-600',
    },
  ];

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
      <div className="space-y-6 w-full min-w-0">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
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
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="text-sm text-gray-500">
              {categories.length} categoria{categories.length !== 1 ? 's' : ''}
            </span>
            <Button
              onClick={() => setCadastroOpen(true)}
              className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Cadastrar categoria
            </Button>
          </div>
        </div>

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
            <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">
              {search ? 'Nenhum resultado para a pesquisa' : 'Nenhuma categoria cadastrada'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              {search
                ? 'Tente ajustar os termos da pesquisa.'
                : 'Cadastre a primeira categoria para organizar os produtos da loja.'}
            </p>
            {!search && (
              <Button
                onClick={() => setCadastroOpen(true)}
                className="mt-4 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white"
              >
                <Plus className="w-4 h-4" />
                Cadastrar categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm w-full min-w-0">
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-0">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 min-w-0">
                      Nome
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden md:table-cell min-w-0">
                      Descrição
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                      Estado
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                      Criada em
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 py-4 whitespace-nowrap w-28">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const active = isCategoryActive(cat.status);
                    return (
                      <tr
                        key={cat._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                tintFor(cat.name)
                              )}
                            >
                              <Tag className="h-4 w-4" />
                            </span>
                            <span
                              className="font-medium text-gray-900 truncate block"
                              title={cat.name}
                            >
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm hidden md:table-cell max-w-xs truncate" title={cat.description || ''}>
                          {cat.description || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                              active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-700'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                active ? 'bg-green-500' : 'bg-gray-500'
                              )}
                            />
                            {active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm hidden lg:table-cell whitespace-nowrap">
                          {formatDate(cat.createdAt) || '—'}
                        </td>
                        <td className="px-2 sm:px-3 py-4 text-right whitespace-nowrap w-28">
                          <div className="flex items-center justify-end gap-0.5">
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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