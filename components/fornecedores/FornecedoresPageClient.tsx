'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Handshake, Eye, Power, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="mb-8 w-full min-w-0">
        {pageError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {pageError}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou NIF..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379] text-sm"
            />
          </div>
          <Button
            onClick={() => setCadastroOpen(true)}
            className="inline-flex items-center gap-2 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Cadastrar fornecedor
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-10 h-10 border-2 border-[#ED5379] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">A carregar fornecedores...</span>
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum fornecedor encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente outro termo de busca.' : 'Cadastre o primeiro fornecedor.'}
            </p>
            {!search && (
              <Button
                onClick={() => setCadastroOpen(true)}
                className="mt-4 bg-[#ED5379] hover:bg-[#ED5379]/90 text-white"
              >
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
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 lg:px-5 py-4 min-w-0">
                      Nome
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 lg:px-5 py-4 hidden md:table-cell whitespace-nowrap">
                      Estado
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 lg:px-5 py-4 hidden sm:table-cell whitespace-nowrap">
                      NIF
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 sm:px-4 lg:px-5 py-4 hidden md:table-cell min-w-0">
                      Contacto
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 sm:px-3 py-4 whitespace-nowrap w-36 sm:w-40">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 lg:px-5 py-4 min-w-0">
                        <span className="font-medium text-gray-900 truncate block" title={p.name}>
                          {p.name}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-4 hidden md:table-cell min-w-0">
                        <span
                          className={cn(
                            'inline-flex text-xs font-medium rounded-full px-2 py-0.5',
                            p.status === 'active' || p.status == null
                              ? 'bg-green-100 text-green-800'
                              : p.status === 'suspended'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-200 text-gray-700'
                          )}
                        >
                          {partnerStatusLabel(p.status == null ? 'active' : String(p.status))}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-4 text-gray-600 text-sm hidden sm:table-cell min-w-0 truncate" title={p.nif || ''}>
                        {p.nif || '—'}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-4 text-gray-600 text-sm hidden md:table-cell min-w-0 truncate" title={[p.email, p.phone || p.telefone, partnerCity(p)].filter(Boolean).join(' · ')}>
                        {[p.email, p.phone || p.telefone, partnerCity(p)]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="px-2 sm:px-3 py-4 text-right whitespace-nowrap w-36 sm:w-40">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && partners.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            {partners.length} fornecedor{partners.length !== 1 ? 'es' : ''}
          </p>
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
