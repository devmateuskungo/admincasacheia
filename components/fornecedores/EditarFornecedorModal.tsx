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
import { Building2, Hash, Mail, MapPin, Phone, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BASE_URL,
  buildPartnerPatchFormData,
  getErrorMessageFromResponse,
  PARTNER_MAX_IMAGES,
  sanitizeBearerToken,
  type PartnerApiStatus,
} from '@/lib/api';
import type { Partner } from './types';
import { partnerImageUrls, partnerPhone } from './types';

function addressFieldsFromPartner(partner: Partner): { street: string; city: string; province: string } {
  const a = partner.address;
  if (a && typeof a === 'object') {
    return {
      street: a.street ?? '',
      city: a.city ?? '',
      province: a.province ?? '',
    };
  }
  if (typeof a === 'string' && a) {
    return { street: a, city: '', province: '' };
  }
  return { street: '', city: '', province: '' };
}

function normalizeStatus(s: string | undefined): PartnerApiStatus {
  if (s === 'inactive' || s === 'suspended' || s === 'active') return s;
  return 'active';
}

interface EditarFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner | null;
  onSuccess?: () => void;
}

export function EditarFornecedorModal({
  open,
  onOpenChange,
  partner,
  onSuccess,
}: EditarFornecedorModalProps) {
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<PartnerApiStatus>('active');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokeNewPreviews = (urls: string[]) => urls.forEach((u) => URL.revokeObjectURL(u));

  useEffect(() => {
    if (!open || !partner) return;
    setName(partner.name ?? '');
    setNif(partner.nif ?? '');
    setEmail(partner.email ?? '');
    setPhone(partnerPhone(partner));
    setStatus(normalizeStatus(partner.status));
    const addr = addressFieldsFromPartner(partner);
    setStreet(addr.street);
    setCity(addr.city);
    setProvince(addr.province);
    setNewImagePreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setNewImageFiles([]);
    setError(null);
  }, [open, partner]);

  const onPickNewImages = (picked: File[]) => {
    const next = picked.slice(0, PARTNER_MAX_IMAGES);
    revokeNewPreviews(newImagePreviews);
    setNewImageFiles(next);
    setNewImagePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles((f) => f.filter((_, i) => i !== index));
    setNewImagePreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      revokeNewPreviews(newImagePreviews);
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setError(null);
    if (!name.trim()) {
      setError('Nome do fornecedor é obrigatório.');
      return;
    }
    if (!BASE_URL) {
      setError('NEXT_PUBLIC_BASE_URL não definida.');
      return;
    }

    const { formData, parts } = buildPartnerPatchFormData({
      name: name.trim(),
      email: email.trim(),
      nif: nif.trim(),
      phone: phone.trim(),
      status,
      address: { street, city, province },
      imageFiles: newImageFiles,
    });

    if (parts < 1) {
      setError('É necessário enviar pelo menos um campo. Adicione dados ou novas imagens.');
      return;
    }

    setLoading(true);
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const token = raw ? sanitizeBearerToken(raw) : '';
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }

      const res = await fetch(`${BASE_URL}/partners/${partner._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setError(msg || `Erro ${res.status}`);
        return;
      }

      revokeNewPreviews(newImagePreviews);
      setNewImageFiles([]);
      setNewImagePreviews([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError('Erro ao guardar.');
    } finally {
      setLoading(false);
    }
  };

  if (!partner) return null;

  const existingUrls = partnerImageUrls(partner);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Editar fornecedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-2" />
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-2" />
              NIF
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-2" />
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PartnerApiStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379] bg-white text-sm"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>

          {existingUrls.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Imagens actuais</p>
              <div className="flex flex-wrap gap-2">
                {existingUrls.map((u) => (
                  <div key={u} className="h-14 w-24 rounded border overflow-hidden bg-gray-100 shrink-0">
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Upload className="w-4 h-4" />
              Novas imagens (opcional, máx. {PARTNER_MAX_IMAGES})
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#ED5379]/10 file:text-[#ED5379] file:text-sm"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                e.target.value = '';
                onPickNewImages(picked);
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {newImagePreviews.map((src, i) => (
                <div key={src} className="relative h-16 w-24 shrink-0 rounded border overflow-hidden bg-gray-50">
                  <Image src={src} alt="" fill className="object-cover" unoptimized sizes="96px" />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 rounded bg-black/60 text-white p-0.5"
                    onClick={() => removeNewImage(i)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Morada
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua / via</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleDialogOpenChange(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#ED5379] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
