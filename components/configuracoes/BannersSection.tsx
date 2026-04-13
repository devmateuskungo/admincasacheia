'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ImageIcon,
  Loader2,
  Pencil,
  Power,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  BASE_URL,
  BANNER_MAX_IMAGES,
  buildBannerFormData,
  getErrorMessageFromResponse,
  sanitizeBearerToken,
} from '@/lib/api';

export interface Banner {
  _id: string;
  images?: string[];
  description?: string;
  active?: boolean;
}

function extractBannersList(data: unknown): Banner[] {
  if (Array.isArray(data)) return data as Banner[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.banners)) return o.banners as Banner[];
    if (Array.isArray(o.data)) return o.data as Banner[];
  }
  return [];
}

function bannerThumbUrls(b: Banner): string[] {
  if (Array.isArray(b.images) && b.images.length > 0) return b.images;
  return [];
}

export function BannersSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createDesc, setCreateDesc] = useState('');
  const [createActive, setCreateActive] = useState(true);
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createPreviews, setCreatePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [editing, setEditing] = useState<Banner | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getToken = () => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return raw ? sanitizeBearerToken(raw) : '';
  };

  const fetchBanners = useCallback(async () => {
    if (!BASE_URL) {
      setBanners([]);
      setListError('NEXT_PUBLIC_BASE_URL não definida.');
      setLoadingList(false);
      return;
    }
    setListError(null);
    setLoadingList(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/banners`, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setListError(msg || `Erro ${res.status}`);
        setBanners([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setBanners(extractBannersList(data));
    } catch {
      setListError('Não foi possível carregar os banners.');
      setBanners([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const revokePreviews = (urls: string[]) => {
    urls.forEach((u) => URL.revokeObjectURL(u));
  };

  const onCreateFiles = (list: File[]) => {
    const next = list.slice(0, BANNER_MAX_IMAGES);
    revokePreviews(createPreviews);
    setCreateFiles(next);
    setCreatePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeCreateFile = (index: number) => {
    const next = createFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(createPreviews[index]);
    setCreateFiles(next);
    setCreatePreviews((p) => p.filter((_, i) => i !== index));
  };

  const resetCreate = () => {
    revokePreviews(createPreviews);
    setCreateFiles([]);
    setCreatePreviews([]);
    setCreateDesc('');
    setCreateActive(true);
    setCreateMsg(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg(null);
    if (!BASE_URL) {
      setCreateMsg({ type: 'err', text: 'BASE_URL não definida.' });
      return;
    }
    const token = getToken();
    if (!token) {
      setCreateMsg({ type: 'err', text: 'Inicie sessão para cadastrar banners.' });
      return;
    }
    if (createFiles.length === 0) {
      setCreateMsg({ type: 'err', text: `Adicione pelo menos 1 imagem (máx. ${BANNER_MAX_IMAGES}).` });
      return;
    }
    setCreating(true);
    try {
      const fd = buildBannerFormData({
        description: createDesc,
        active: createActive,
        imageFiles: createFiles,
      });
      const res = await fetch(`${BASE_URL}/banners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: fd,
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setCreateMsg({ type: 'err', text: msg || 'Erro ao cadastrar.' });
        return;
      }
      resetCreate();
      setShowCreate(false);
      await fetchBanners();
    } catch {
      setCreateMsg({ type: 'err', text: 'Erro ao cadastrar.' });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setEditDesc(b.description ?? '');
    setEditActive(b.active !== false);
    revokePreviews(editNewPreviews);
    setEditNewFiles([]);
    setEditNewPreviews([]);
    setEditError(null);
  };

  const onEditNewFiles = (list: File[]) => {
    const next = list.slice(0, BANNER_MAX_IMAGES);
    revokePreviews(editNewPreviews);
    setEditNewFiles(next);
    setEditNewPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeEditNewFile = (index: number) => {
    const next = editNewFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(editNewPreviews[index]);
    setEditNewFiles(next);
    setEditNewPreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    if (!BASE_URL) {
      setEditError('BASE_URL não definida.');
      return;
    }
    const token = getToken();
    if (!token) {
      setEditError('Sessão expirada.');
      return;
    }
    setSavingEdit(true);
    try {
      const fd = buildBannerFormData({
        description: editDesc,
        active: editActive,
        imageFiles: editNewFiles.length > 0 ? editNewFiles : undefined,
      });
      const res = await fetch(`${BASE_URL}/banners/${editing._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: fd,
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setEditError(msg || 'Erro ao actualizar.');
        return;
      }
      revokePreviews(editNewPreviews);
      setEditNewFiles([]);
      setEditNewPreviews([]);
      setEditing(null);
      await fetchBanners();
    } catch {
      setEditError('Erro ao actualizar.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!BASE_URL) return;
    const token = getToken();
    if (!token) return;
    setTogglingId(id);
    try {
      const res = await fetch(`${BASE_URL}/banners/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setListError(msg || 'Erro ao alternar estado.');
        return;
      }
      await fetchBanners();
    } catch {
      setListError('Erro ao alternar estado.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !BASE_URL) return;
    const token = getToken();
    if (!token) {
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/banners/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setListError(msg || 'Erro ao eliminar.');
        return;
      }
      setDeleteTarget(null);
      await fetchBanners();
    } catch {
      setListError('Erro ao eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ED5379]/10 text-[#ED5379]">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">Banners</CardTitle>
              <CardDescription className="mt-1 text-sm">
                Até {BANNER_MAX_IMAGES} imagens por banner (obrigatório no cadastro), descrição opcional e estado
                activo. Pode alternar visibilidade ou editar com novas imagens.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {listError && (
            <div className="rounded-lg bg-amber-50 text-amber-900 border border-amber-200 px-3 py-2 text-sm">
              {listError}
            </div>
          )}

          {!showCreate ? (
            <Button
              variant="outline"
              onClick={() => {
                resetCreate();
                setShowCreate(true);
              }}
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Novo banner
            </Button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 border-t border-gray-100 pt-4">
              {createMsg && (
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    createMsg.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                  )}
                >
                  {createMsg.text}
                </div>
              )}
              <div>
                <Label className="text-gray-700">Imagens * (máx. {BANNER_MAX_IMAGES})</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="mt-1 cursor-pointer"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []);
                    e.target.value = '';
                    onCreateFiles(picked);
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {createPreviews.map((src, i) => (
                    <div key={src} className="relative h-16 w-28 rounded border overflow-hidden bg-gray-50">
                      <Image src={src} alt="" fill className="object-cover" unoptimized sizes="112px" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded bg-black/60 text-white p-0.5"
                        onClick={() => removeCreateFile(i)}
                        aria-label="Remover imagem"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="banner-desc" className="text-gray-700">
                  Descrição (opcional)
                </Label>
                <Textarea
                  id="banner-desc"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Texto auxiliar ou nota interna"
                  className="mt-1 min-h-[72px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="banner-active" checked={createActive} onCheckedChange={setCreateActive} />
                <Label htmlFor="banner-active" className="text-gray-700 cursor-pointer">
                  Activo (padrão: sim)
                </Label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={creating} className="bg-[#ED5379] hover:bg-[#ED5379]/90">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      A cadastrar...
                    </>
                  ) : (
                    'Cadastrar banner'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={creating}
                  onClick={() => {
                    setShowCreate(false);
                    resetCreate();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Banners cadastrados</h3>
            {loadingList ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar…
              </div>
            ) : banners.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Nenhum banner listado.</p>
            ) : (
              <ul className="space-y-3">
                {banners.map((b) => {
                  const urls = bannerThumbUrls(b);
                  const first = urls[0];
                  return (
                    <li
                      key={b._id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 p-3 bg-gray-50/50"
                    >
                      <div className="h-14 w-24 shrink-0 rounded overflow-hidden bg-gray-200 relative">
                        {first ? (
                          <img src={first} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {b.description?.trim() || 'Sem descrição'}
                        </p>
                        <p className="text-xs mt-0.5">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5',
                              b.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                            )}
                          >
                            {b.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                          {urls.length > 1 ? (
                            <span className="text-gray-500 ml-2">{urls.length} imagens</span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={togglingId === b._id}
                          onClick={() => void handleToggle(b._id)}
                          title="Ativar / desativar"
                        >
                          {togglingId === b._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditNewPreviews((prev) => {
              prev.forEach((u) => URL.revokeObjectURL(u));
              return [];
            });
            setEditNewFiles([]);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actualizar banner</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">
                  {editError}
                </div>
              )}
              <div>
                <Label className="text-gray-700">Imagens actuais</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {bannerThumbUrls(editing).length === 0 ? (
                    <span className="text-sm text-gray-500">Nenhuma URL na resposta.</span>
                  ) : (
                    bannerThumbUrls(editing).map((u) => (
                      <div key={u} className="h-14 w-24 rounded border overflow-hidden relative bg-gray-100">
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Novas imagens (opcional, máx. {BANNER_MAX_IMAGES})</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="mt-1 cursor-pointer"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []);
                    e.target.value = '';
                    onEditNewFiles(picked);
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {editNewPreviews.map((src, i) => (
                    <div key={src} className="relative h-16 w-28 rounded border overflow-hidden bg-gray-50">
                      <Image src={src} alt="" fill className="object-cover" unoptimized sizes="112px" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded bg-black/60 text-white p-0.5"
                        onClick={() => removeEditNewFile(i)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-banner-desc">Descrição</Label>
                <Textarea
                  id="edit-banner-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 min-h-[72px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit-active" checked={editActive} onCheckedChange={setEditActive} />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Activo
                </Label>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingEdit} className="bg-[#ED5379] hover:bg-[#ED5379]/90">
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      A guardar...
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar este banner?</AlertDialogTitle>
            <AlertDialogDescription>Esta acção remove o banner no servidor e não pode ser desfeita aqui.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  A eliminar...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
