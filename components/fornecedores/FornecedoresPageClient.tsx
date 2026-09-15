'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Handshake,
  Eye,
  Power,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CadastroFornecedorModal } from './CadastroFornecedorModal';
import { EditarFornecedorModal } from './EditarFornecedorModal';
import { DetalhesFornecedorModal } from './DetalhesFornecedorModal';
import type { Partner } from './types';
import { extractPartnersList, partnerCity, partnerStatusLabel } from './types';
import { BASE_URL, getErrorMessageFromResponse, sanitizeBearerToken } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Query string usada em GET /partners/search — ajuste se o backend usar outro nome (ex.: q, term). */
const SEARCH_QUERY_KEY = 'search';

const PARTNER_TINTS = [
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
  return PARTNER_TINTS[hash % PARTNER_TINTS.length];
}

function initialFor(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

function partnerStatusTone(s: Partner['status']) {
  if (s === 'active' || s == null) {
    return { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
  }
  if (s === 'suspended') {
    return { badge: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' };
  }
  return { badge: 'bg-gray-200 text-gray-700', dot: 'bg-gray-500' };
}

export function FornecedoresPageClient() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = raw ? sanitizeBearerToken(raw) : '';
    if (!token) {
      setPartners([]);
      setLoading(false);
      return;
    }
    try {
      const trimmed = search.trim();
      const url = trimmed
        ? `${BASE_URL}/partners/search?${SEARCH_QUERY_KEY}=${encodeURIComponent(trimmed)}`
        : `${BASE_URL}/partners`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setPageError(msg || 'Falha ao carregar');
        setPartners([]);
        return;
      }
      const data = await res.json();
      setPartners(extractPartnersList(data));
    } catch {
      setPartners([]);
      setPageError('Falha ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchPartners(), 300);
    return () => clearTimeout(t);
  }, [fetchPartners]);

  const activeCount = partners.filter((p) => p.status === 'active' || p.status == null).length;
  const suspendedCount = partners.filter((p) => p.status === 'suspended').length;
  const inactiveCount = Math.max(0, partners.length - activeCount - suspendedCount);

  const statCards = [
    {
      label: 'Total',
      value: partners.length,
      icon: Handshake,
      tint: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Activos',
      value: activeCount,
      icon: CheckCircle2,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Suspensos',
      value: suspendedCount,
      icon: AlertTriangle,
      tint: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Inactivos',
      value: inactiveCount,
      icon: XCircle,
      tint: 'bg-gray-100 text-gray-600',
    },
  ];

  const handleConfirmDelete = async () => {
    if (!partnerToDelete) return;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = raw ? sanitizeBearerToken(raw) : '';
    if (!token) {
      setPartnerToDelete(null);
      return;
    }
    setDeleting(true);
    setPageError(null);
    try {
      const res = await fetch(`${BASE_URL}/partners/${partnerToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setPageError(msg || 'Erro ao eliminar.');
        return;
      }
      setPartnerToDelete(null);
      await fetchPartners();
    } catch {
      setPageError('Erro ao eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePartner = async (p: Partner) => {
    if (!BASE_URL) return;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = raw ? sanitizeBearerToken(raw) : '';
    if (!token) return;
    setTogglingId(p._id);
    setPageError(null);
    try {
      const res = await fetch(`${BASE_URL}/partners/${p._id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setPageError(msg || 'Erro ao alternar estado.');
        return;
      }
      await fetchPartners();
    } catch {
      setPageError('Erro ao alternar estado.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6 w-full min-w-0">
        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {pageError}
          </div>
        )}

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
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou NIF..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <span className="text-sm text-gray-500">
              {partners.length} fornecedor{partners.length !== 1 ? 'es' : ''}
            </span>
            <Button
              onClick={() => setCadastroOpen(true)}
              className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Cadastrar fornecedor
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
            <Handshake className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">
              {search ? 'Nenhum resultado para a pesquisa' : 'Nenhum fornecedor cadastrado'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              {search
                ? 'Tente ajustar os termos da pesquisa.'
                : 'Cadastre o primeiro fornecedor para gerir os seus parceiros.'}
            </p>
            {!search && (
              <Button
                onClick={() => setCadastroOpen(true)}
                className="mt-4 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white"
              >
                <Plus className="w-4 h-4" />
                Cadastrar fornecedor
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
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden md:table-cell whitespace-nowrap">
                      NIF
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden sm:table-cell min-w-0">
                      Contacto
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                      Estado
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 py-4 whitespace-nowrap w-40">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => {
                    const tone = partnerStatusTone(p.status);
                    const contact = [p.email, p.phone || p.telefone, partnerCity(p)]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <tr
                        key={p._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 min-w-0">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                                tintFor(p.name)
                              )}
                            >
                              {initialFor(p.name)}
                            </span>
                            <span
                              className="font-medium text-gray-900 truncate block"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm hidden md:table-cell min-w-0 truncate" title={p.nif || ''}>
                          {p.nif || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm hidden sm:table-cell min-w-0 truncate" title={contact}>
                          {contact || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                              tone.badge
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                            {partnerStatusLabel(p.status == null ? 'active' : String(p.status))}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-4 text-right whitespace-nowrap w-40">
                          <div className="flex items-center justify-end gap-0.5 flex-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailsId(p._id)}
                              className="p-2 rounded-lg text-gray-500 hover:text-[#ED5379] hover:bg-[#ED5379]/10 transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleTogglePartner(p)}
                              disabled={togglingId === p._id}
                              className="p-2 rounded-lg text-gray-500 hover:text-[#ED5379] hover:bg-[#ED5379]/10 transition-colors disabled:opacity-50"
                              title="Ativar / desativar (toggle)"
                            >
                              {togglingId === p._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPartner(p)}
                              className="p-2 rounded-lg text-gray-500 hover:text-[#ED5379] hover:bg-[#ED5379]/10 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerToDelete(p)}
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

      <CadastroFornecedorModal
        open={cadastroOpen}
        onOpenChange={setCadastroOpen}
        onSuccess={() => {
          setCadastroOpen(false);
          void fetchPartners();
        }}
      />

      <EditarFornecedorModal
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
        partner={editingPartner}
        onSuccess={() => {
          setEditingPartner(null);
          void fetchPartners();
        }}
      />

      <DetalhesFornecedorModal
        open={!!detailsId}
        onOpenChange={(open) => !open && setDetailsId(null)}
        partnerId={detailsId}
      />

      <AlertDialog open={!!partnerToDelete} onOpenChange={(open) => !open && setPartnerToDelete(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-5 h-5" />
              </span>
              Eliminar fornecedor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{partnerToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPartnerToDelete(null)} disabled={deleting}>
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