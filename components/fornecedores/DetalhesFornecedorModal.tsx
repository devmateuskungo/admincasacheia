'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Hash, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_URL, sanitizeBearerToken } from '@/lib/api';
import type { Partner, PartnerAddress } from './types';
import {
  extractPartnerOne,
  partnerAddressSummary,
  partnerImageUrls,
  partnerPhone,
  partnerStatusLabel,
} from './types';

interface DetalhesFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string | null;
}

function PartnerDetailsBody({ partner }: { partner: Partner }) {
  const rawAddr = partner.address;
  const structured =
    rawAddr && typeof rawAddr === 'object' ? (rawAddr as PartnerAddress) : null;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-gray-500">Nome</p>
        <p className="font-semibold text-gray-900">{partner.name}</p>
      </div>
      {partner.status != null && partner.status !== '' && (
        <div>
          <p className="text-xs font-medium text-gray-500">Estado</p>
          <p className="text-gray-800">{partnerStatusLabel(String(partner.status))}</p>
        </div>
      )}
      {partnerImageUrls(partner).length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Imagens</p>
          <div className="flex flex-wrap gap-2">
            {partnerImageUrls(partner).map((u) => (
              <a
                key={u}
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-16 w-24 rounded border overflow-hidden bg-gray-100 shrink-0"
              >
                <img src={u} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
      {partner.nif && (
        <div className="flex items-start gap-2">
          <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">NIF</p>
            <p className="text-gray-800">{partner.nif}</p>
          </div>
        </div>
      )}
      {partner.email && (
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">E-mail</p>
            <p className="text-gray-800">{partner.email}</p>
          </div>
        </div>
      )}
      {partnerPhone(partner) && (
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Telefone</p>
            <p className="text-gray-800">{partnerPhone(partner)}</p>
          </div>
        </div>
      )}
      {partnerAddressSummary(partner) && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Morada</p>
            {structured ? (
              <ul className="text-gray-800 space-y-0.5 mt-0.5">
                {structured.street && <li>{structured.street}</li>}
                {(structured.city || structured.province) && (
                  <li>{[structured.city, structured.province].filter(Boolean).join(' · ')}</li>
                )}
              </ul>
            ) : (
              <p className="text-gray-800">{partnerAddressSummary(partner)}</p>
            )}
          </div>
        </div>
      )}
      {(partner.createdAt || partner.updatedAt) && (
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          {partner.createdAt && (
            <span className="block">Criado: {new Date(partner.createdAt).toLocaleString('pt-PT')}</span>
          )}
          {partner.updatedAt && (
            <span className="block">Actualizado: {new Date(partner.updatedAt).toLocaleString('pt-PT')}</span>
          )}
        </p>
      )}
    </div>
  );
}

export function DetalhesFornecedorModal({
  open,
  onOpenChange,
  partnerId,
}: DetalhesFornecedorModalProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDialogChange = (next: boolean) => {
    if (!next) {
      setPartner(null);
      setError(null);
      setLoading(false);
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open || !partnerId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = raw ? sanitizeBearerToken(raw) : '';
      if (!token) {
        if (!cancelled) {
          setError('Sessão expirada.');
          setPartner(null);
        }
        return;
      }
      if (!cancelled) {
        setLoading(true);
        setError(null);
        setPartner(null);
      }
      fetch(`${BASE_URL}/partners/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Não foi possível carregar o fornecedor.');
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          const p = extractPartnerOne(data);
          setPartner(p);
          if (!p) setError('Dados inválidos na resposta.');
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : 'Erro ao carregar.');
          setPartner(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, partnerId]);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className={cn('sm:max-w-md')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#ED5379]" />
            Detalhes do fornecedor
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">A carregar...</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        {!loading && !error && partner && <PartnerDetailsBody partner={partner} />}
      </DialogContent>
    </Dialog>
  );
}
