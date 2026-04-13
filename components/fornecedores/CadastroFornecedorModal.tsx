'use client';

import React, { useState } from 'react';
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
  buildPartnerCreateFormData,
  getErrorMessageFromResponse,
  PARTNER_MAX_IMAGES,
  sanitizeBearerToken,
  type PartnerApiStatus,
} from '@/lib/api';

interface CadastroFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CadastroFornecedorModal({
  open,
  onOpenChange,
  onSuccess,
}: CadastroFornecedorModalProps) {
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<PartnerApiStatus>('active');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokePreviews = (urls: string[]) => urls.forEach((u) => URL.revokeObjectURL(u));

  const reset = () => {
    setName('');
    setNif('');
    setEmail('');
    setPhone('');
    setStatus('active');
    setStreet('');
    setCity('');
    setProvince('');
    revokePreviews(imagePreviews);
    setImageFiles([]);
    setImagePreviews([]);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onPickImages = (picked: File[]) => {
    const next = picked.slice(0, PARTNER_MAX_IMAGES);
    revokePreviews(imagePreviews);
    setImageFiles(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((f) => f.filter((_, i) => i !== index));
    setImagePreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nome do fornecedor é obrigatório.');
      return;
    }
    if (!email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }
    if (!nif.trim()) {
      setError('NIF é obrigatório.');
      return;
    }
    if (!phone.trim()) {
      setError('Telefone é obrigatório.');
      return;
    }
    if (!BASE_URL) {
      setError('NEXT_PUBLIC_BASE_URL não definida.');
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

      const formData = buildPartnerCreateFormData({
        name: name.trim(),
        email: email.trim(),
        nif: nif.trim(),
        phone: phone.trim(),
        status,
        address: { street, city, province },
        imageFiles,
      });

      const res = await fetch(`${BASE_URL}/partners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setError(msg || `Erro ${res.status}`);
        return;
      }

      reset();
      handleClose(false);
      onSuccess?.();
    } catch {
      setError('Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Cadastrar fornecedor</DialogTitle>
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
              placeholder="Ex.: Empresa Exemplo Lda"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-2" />
              NIF *
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
              placeholder="5400123456"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-2" />
                E-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="contato@exemplo.ao"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="923000111"
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
            <p className="text-xs text-gray-500 mt-0.5">Opcional na API; por defeito enviamos o valor escolhido.</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Upload className="w-4 h-4" />
              Imagens (opcional, máx. {PARTNER_MAX_IMAGES})
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#ED5379]/10 file:text-[#ED5379] file:text-sm"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                e.target.value = '';
                onPickImages(picked);
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((src, i) => (
                <div key={src} className="relative h-16 w-24 shrink-0 rounded border overflow-hidden bg-gray-50">
                  <Image src={src} alt="" fill className="object-cover" unoptimized sizes="96px" />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 rounded bg-black/60 text-white p-0.5"
                    onClick={() => removeImage(i)}
                    aria-label="Remover imagem"
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
              Morada (opcional)
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua / via</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                placeholder="Via AL15"
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
                  placeholder="Talatona"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Província</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED5379] focus:border-[#ED5379]"
                  placeholder="Luanda"
                />
              </div>
            </div>
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
