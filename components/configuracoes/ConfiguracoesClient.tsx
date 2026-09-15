'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PerfilModal } from './PerfilModal';
import { BannersSection } from './BannersSection';
import {
  BASE_URL,
  sanitizeBearerToken,
  getErrorMessageFromResponse,
} from '@/lib/api';

const STORAGE_LOCATION = 'companyLocation';

/** Valores oficiais (GET /api/coordinates) quando o servidor ou o armazenamento local ainda não têm dados. */
const DEFAULT_COMPANY_LOCATION: CompanyLocation = {
  name: 'Casa Cheia',
  latitude: '-8.815',
  longitude: '13.23',
};

interface CompanyLocation {
  name?: string;
  latitude: string;
  longitude: string;
}

const ACAO_PERFIL = {
  icon: User,
  title: 'Perfil do usuário',
  description: 'Ver e editar seus dados (nome, telefone) e alterar a senha de acesso de forma segura.',
  label: 'Abrir perfil',
};

const ACAO_LOCALIZACAO = {
  icon: MapPin,
  title: 'Localização da empresa',
  description: 'Definir as coordenadas (latitude e longitude) da sua empresa para entregas, mapas ou integrações.',
  label: 'Definir localização',
};

export function ConfiguracoesClient() {
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loadingInitialCoords, setLoadingInitialCoords] = useState(true);
  /** Qual pedido ao servidor está em curso (cadastrar POST ou actualizar PUT). */
  const [locationActionLoading, setLocationActionLoading] = useState<'cadastrar' | 'atualizar' | null>(null);
  const [locationMessage, setLocationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [gettingGeo, setGettingGeo] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingCoords, setRemovingCoords] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const applyLocalOrDefault = () => {
      try {
        const raw = localStorage.getItem(STORAGE_LOCATION);
        if (raw) {
          const loc = JSON.parse(raw) as CompanyLocation;
          setCompanyName(loc.name ?? '');
          setLatitude(loc.latitude ?? '');
          setLongitude(loc.longitude ?? '');
          return;
        }
      } catch {
        // ignore
      }
      setCompanyName(DEFAULT_COMPANY_LOCATION.name ?? '');
      setLatitude(DEFAULT_COMPANY_LOCATION.latitude);
      setLongitude(DEFAULT_COMPANY_LOCATION.longitude);
    };

    (async () => {
      const tokenRaw = localStorage.getItem('token');
      const token = tokenRaw ? sanitizeBearerToken(tokenRaw) : '';

      if (!BASE_URL) {
        if (!cancelled) applyLocalOrDefault();
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/coordinates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!cancelled && res.ok) {
          const data = (await res.json()) as {
            name?: string;
            latitude?: number;
            longitude?: number;
          };
          if (data != null && data.latitude != null && data.longitude != null) {
            const name =
              typeof data.name === 'string' && data.name.trim()
                ? data.name.trim()
                : DEFAULT_COMPANY_LOCATION.name ?? '';
            const lat = String(data.latitude);
            const lng = String(data.longitude);
            setCompanyName(name);
            setLatitude(lat);
            setLongitude(lng);
            try {
              localStorage.setItem(
                STORAGE_LOCATION,
                JSON.stringify({ name, latitude: lat, longitude: lng } satisfies CompanyLocation)
              );
            } catch {
              // ignore
            }
            return;
          }
        }
      } catch {
        // fallback below
      }

      if (!cancelled) applyLocalOrDefault();
    })().finally(() => {
      if (!cancelled) setLoadingInitialCoords(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const geoErrorMessage = (err: GeolocationPositionError): string => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Acesso à localização recusado. No Chrome: ícone de cadeado na barra de endereço → Permissões → Localização → Permitir. Depois volte a clicar em «Usar minha localização».';
      case err.POSITION_UNAVAILABLE:
        return 'O dispositivo não conseguiu determinar a posição (rede ou GPS indisponível). Tente noutra rede ou introduza as coordenadas manualmente.';
      case err.TIMEOUT:
        return 'Tempo esgotado ao pedir a localização. Tente de novo ou introduza latitude e longitude manualmente.';
      default:
        return 'Não foi possível obter a localização.';
    }
  };

  const handleUseMyLocation = () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setLocationMessage({
        type: 'error',
        text: 'A geolocalização no browser só funciona em HTTPS ou em http://localhost. Abra o painel com um destes endereços.',
      });
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage({ type: 'error', text: 'Geolocalização não suportada no seu browser.' });
      return;
    }
    setLocationMessage(null);
    setGettingGeo(true);
    const options: PositionOptions = {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 25_000,
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setGettingGeo(false);
        setLocationMessage({ type: 'success', text: 'Coordenadas preenchidas com a sua localização actual.' });
      },
      (err) => {
        setGettingGeo(false);
        setLocationMessage({ type: 'error', text: geoErrorMessage(err) });
      },
      options
    );
  };

  const readValidatedLocation = ():
    | { name: string; lat: string; lng: string; numLat: number; numLng: number }
    | null => {
    setLocationMessage(null);
    const name = (companyName.trim() || DEFAULT_COMPANY_LOCATION.name || '').trim();
    const lat = latitude.trim();
    const lng = longitude.trim();
    if (!name) {
      setLocationMessage({ type: 'error', text: 'Indique o nome da empresa.' });
      return null;
    }
    if (!lat || !lng) {
      setLocationMessage({ type: 'error', text: 'Preencha latitude e longitude.' });
      return null;
    }
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (Number.isNaN(numLat) || Number.isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      setLocationMessage({ type: 'error', text: 'Coordenadas inválidas. Latitude: -90 a 90, Longitude: -180 a 180.' });
      return null;
    }
    return { name, lat, lng, numLat, numLng };
  };

  const persistLocationAfterSuccess = (name: string, lat: string, lng: string) => {
    const payload: CompanyLocation = { name, latitude: lat, longitude: lng };
    try {
      localStorage.setItem(STORAGE_LOCATION, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const sendLocationToServer = async (method: 'POST' | 'PUT') => {
    const parsed = readValidatedLocation();
    if (!parsed) return;

    if (!BASE_URL) {
      setLocationMessage({
        type: 'error',
        text: 'NEXT_PUBLIC_BASE_URL não definida — não é possível enviar ao servidor.',
      });
      return;
    }
    const tokenRaw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = tokenRaw ? sanitizeBearerToken(tokenRaw) : '';
    if (!token) {
      setLocationMessage({
        type: 'error',
        text: 'Inicie sessão para enviar a localização ao servidor.',
      });
      return;
    }

    const label = method === 'POST' ? 'cadastrar' : 'atualizar';
    setLocationActionLoading(label);
    try {
      const body = JSON.stringify({
        name: parsed.name,
        latitude: parsed.numLat,
        longitude: parsed.numLng,
      });
      const res = await fetch(`${BASE_URL}/coordinates`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setLocationMessage({
          type: 'error',
          text:
            method === 'POST'
              ? `Não foi possível cadastrar no servidor: ${msg}`
              : `Não foi possível actualizar no servidor: ${msg}`,
        });
        return;
      }

      persistLocationAfterSuccess(parsed.name, parsed.lat, parsed.lng);
      setLocationMessage({
        type: 'success',
        text:
          method === 'POST'
            ? 'Coordenadas cadastradas no servidor.'
            : 'Coordenadas actualizadas no servidor.',
      });
    } catch {
      setLocationMessage({
        type: 'error',
        text: method === 'POST' ? 'Erro ao cadastrar.' : 'Erro ao actualizar.',
      });
    } finally {
      setLocationActionLoading(null);
    }
  };

  const handleConfirmRemoveCoordinates = async () => {
    setLocationMessage(null);
    if (!BASE_URL) {
      setLocationMessage({
        type: 'error',
        text: 'NEXT_PUBLIC_BASE_URL não definida — não é possível contactar o servidor.',
      });
      setRemoveDialogOpen(false);
      return;
    }
    const tokenRaw = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const token = tokenRaw ? sanitizeBearerToken(tokenRaw) : '';
    if (!token) {
      setLocationMessage({ type: 'error', text: 'Inicie sessão para eliminar as coordenadas no servidor.' });
      setRemoveDialogOpen(false);
      return;
    }
    setRemovingCoords(true);
    try {
      const res = await fetch(`${BASE_URL}/coordinates`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res);
        setLocationMessage({ type: 'error', text: `Não foi possível eliminar no servidor: ${msg}` });
        return;
      }
      try {
        localStorage.removeItem(STORAGE_LOCATION);
      } catch {
        // ignore
      }
      setCompanyName(DEFAULT_COMPANY_LOCATION.name ?? '');
      setLatitude(DEFAULT_COMPANY_LOCATION.latitude);
      setLongitude(DEFAULT_COMPANY_LOCATION.longitude);
      setLocationMessage({ type: 'success', text: 'Coordenadas eliminadas no servidor.' });
      setRemoveDialogOpen(false);
    } catch {
      setLocationMessage({ type: 'error', text: 'Erro ao remover.' });
    } finally {
      setRemovingCoords(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        Escolha uma acção abaixo. Cada opção tem um ícone e uma breve explicação do que faz.
      </p>

      {/* Sessão: acções com ícone e descrição */}
      <div className="grid gap-4 sm:grid-cols-1">
        {/* Perfil do usuário */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ED5379]/10 text-[#ED5379]">
                <ACAO_PERFIL.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{ACAO_PERFIL.title}</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {ACAO_PERFIL.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setPerfilOpen(true)}
              className="w-full sm:w-auto bg-[#ED5379] hover:bg-[#ED5379]/90"
            >
              {ACAO_PERFIL.label}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Localização da empresa */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ED5379]/10 text-[#ED5379]">
                <ACAO_LOCALIZACAO.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{ACAO_LOCALIZACAO.title}</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {ACAO_LOCALIZACAO.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {!showLocationForm ? (
              <Button
                variant="outline"
                onClick={() => setShowLocationForm(true)}
                className="w-full sm:w-auto"
              >
                {ACAO_LOCALIZACAO.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="space-y-4 pt-2 border-t border-gray-100"
              >
                {loadingInitialCoords ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-9 w-full rounded-md sm:max-w-md" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-full rounded-md" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-full rounded-md" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-9 w-44 rounded-md" />
                      <Skeleton className="h-9 w-28 rounded-md" />
                      <Skeleton className="h-9 w-28 rounded-md" />
                    </div>
                  </div>
                ) : (
                  <>
                    {locationMessage && (
                      <div
                        className={`rounded-lg px-4 py-2 text-sm ${
                          locationMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {locationMessage.text}
                      </div>
                    )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Casa Cheia"
                    className="w-full max-w-md"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Ex: -8.8399"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Entre -90 e 90</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Ex: 13.2894"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Entre -180 e 180</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseMyLocation}
                    disabled={gettingGeo || locationActionLoading !== null}
                  >
                    {gettingGeo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {gettingGeo ? ' A obter...' : ' Usar minha localização'}
                  </Button>
                  <Button
                    type="button"
                    disabled={locationActionLoading !== null || removingCoords}
                    className="bg-[#ED5379] hover:bg-[#ED5379]/90"
                    onClick={() => void sendLocationToServer('POST')}
                  >
                    {locationActionLoading === 'cadastrar' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        A cadastrar...
                      </>
                    ) : (
                      'Cadastrar'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={locationActionLoading !== null || removingCoords}
                    onClick={() => void sendLocationToServer('PUT')}
                  >
                    {locationActionLoading === 'atualizar' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        A actualizar...
                      </>
                    ) : (
                      'Actualizar'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setRemoveDialogOpen(true)}
                    disabled={locationActionLoading !== null || removingCoords}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={locationActionLoading !== null}
                    onClick={() => setShowLocationForm(false)}
                  >
                    Ocultar
                  </Button>
                </div>
                  </>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <BannersSection />
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar coordenadas?</AlertDialogTitle>
            <AlertDialogDescription>
              As coordenadas da empresa serão apagadas no servidor (DELETE). Pode voltar a cadastrar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingCoords}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removingCoords}
              onClick={() => void handleConfirmRemoveCoordinates()}
            >
              {removingCoords ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  A eliminar...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PerfilModal
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
        onSuccess={() => setPerfilOpen(false)}
      />
    </div>
  );
}
