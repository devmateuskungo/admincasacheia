"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, Route as RouteIcon, Clock } from "lucide-react";
import { formatKwanza } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { BASE_URL, sanitizeBearerToken } from "@/lib/api";

type LeafletNS = typeof import("leaflet");
type LMap = import("leaflet").Map;
type LLayerGroup = import("leaflet").LayerGroup;

export interface MapShippingAddress {
  contactName?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  coordinates?: unknown;
}

export interface MapProduto {
  productName?: string;
  image?: string;
  unitPrice?: number;
  quantity?: number;
  totalItem?: number;
}

export interface MapOrder {
  _id: string;
  orderNumber?: string;
  total?: number;
  totalItens?: number;
  resumoFinanceiro?: { subtotal?: number; total?: number };
  status?: string;
  statusLabel?: string;
  paymentMethod?: string;
  user?: string | { name?: string };
  produtos?: MapProduto[];
  createdAt?: string;
  entrega?: MapShippingAddress;
  shippingAddress?: MapShippingAddress;
}

function deliveryAddress(order: MapOrder): MapShippingAddress | undefined {
  return order.entrega ?? order.shippingAddress;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteInfo {
  distance: number; // metros
  duration: number; // segundos
  geometry: [number, number][]; // [lat, lng][]
  fallback?: boolean;
}

const DEFAULT_CENTER: [number, number] = [-8.8383, 13.2344]; // Luanda, Angola
/** Localização da loja (GET /coordinates) usada como origem das rotas, caso o servidor falhe. */
const STORE_FALLBACK: Coordinates = { lat: -8.979614, lng: 13.400024 };
const OSRM_ROUTE_BASE = "https://router.project-osrm.org/route/v1/driving";
/** Velocidade média usada quando o serviço de rotas não responde (estimativa em linha reta). */
const FALLBACK_SPEED_KMH = 30;
const ROUTE_CONCURRENCY = 4;

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  shipped: "#6366f1",
  delivered: "#22c55e",
  canceled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCoords(lat: unknown, lng: unknown): Coordinates | null {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lng: lo };
}

function parseCoordinates(raw: unknown): Coordinates | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return parseCoordinates(JSON.parse(text));
      } catch {
        return null;
      }
    }
    const parts = text.split(/[,;]/).map((p) => p.trim());
    if (parts.length >= 2) return normalizeCoords(parts[0], parts[1]);
    return null;
  }

  if (Array.isArray(raw)) {
    return raw.length >= 2 ? normalizeCoords(raw[0], raw[1]) : null;
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (obj.type === "Point" && Array.isArray(obj.coordinates)) {
      return obj.coordinates.length >= 2
        ? normalizeCoords(obj.coordinates[1], obj.coordinates[0])
        : null;
    }
    return normalizeCoords(
      obj.lat ?? obj.latitude,
      obj.lng ?? obj.lon ?? obj.longitude
    );
  }

  return null;
}

function userLabel(user?: MapOrder["user"]): string {
  if (user == null) return "—";
  if (typeof user === "string") return user.trim() || "—";
  return user.name?.trim() || "—";
}

function orderTotal(order: MapOrder): number {
  return Number(order.resumoFinanceiro?.total ?? order.total ?? 0);
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(address?: MapShippingAddress): string {
  if (!address) return "";
  const parts = [address.street, address.city].filter(
    (p): p is string => Boolean(p && p.trim())
  );
  return parts.join(", ");
}

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toLocaleString("pt-PT", {
    minimumFractionDigits: km < 10 ? 1 : 0,
    maximumFractionDigits: km < 10 ? 1 : 0,
  })} km`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** Rota de condução (OSRM). Em caso de falha, estima em linha reta a FALLBACK_SPEED_KMH. */
async function fetchRoute(
  from: Coordinates,
  to: Coordinates,
  signal: AbortSignal
): Promise<RouteInfo | null> {
  try {
    const url = `${OSRM_ROUTE_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = (await res.json()) as {
      routes?: {
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: number[][] };
      }[];
    };
    const route = json.routes?.[0];
    if (!route || route.distance == null || route.duration == null) {
      throw new Error("OSRM sem rota");
    }
    const geometry = (route.geometry?.coordinates ?? [])
      .filter((c) => Array.isArray(c) && c.length >= 2)
      .map((c) => [c[1], c[0]] as [number, number]);
    return { distance: route.distance, duration: route.duration, geometry };
  } catch (err) {
    if (signal.aborted) return null;
    void err;
    const distance = haversineMeters(from, to);
    return {
      distance,
      duration: (distance / 1000 / FALLBACK_SPEED_KMH) * 3600,
      geometry: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      fallback: true,
    };
  }
}

function pinSvg(color: string): string {
  return (
    `<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 23 13 23s13-13.3 13-23C26 5.8 20.2 0 13 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
    `<circle cx="13" cy="13" r="5" fill="#ffffff"/>` +
    `</svg>`
  );
}

function storePinSvg(): string {
  return (
    `<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="17" cy="17" r="16" fill="#111827" stroke="#ffffff" stroke-width="2"/>` +
    `<path d="M10 15l7-5 7 5v8a1 1 0 0 1-1 1h-4v-5h-4v5h-4a1 1 0 0 1-1-1z" fill="#ffffff"/>` +
    `</svg>`
  );
}

function popupHtml(
  order: MapOrder,
  coords: Coordinates,
  route?: RouteInfo | null,
  origin?: Coordinates | null
): string {
  const key = (order.status ?? "").toLowerCase();
  const color = STATUS_COLORS[key] ?? "#6b7280";
  const label = order.statusLabel ?? STATUS_LABELS[key] ?? order.status ?? "—";
  const address = deliveryAddress(order);
  const addressText = formatAddress(address);
  const mapsUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${coords.lat},${coords.lng}&travelmode=driving`
    : `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;

  const items = (order.produtos ?? []).slice(0, 4);
  const itemsHtml = items
    .map((produto) => {
      const thumb = produto.image
        ? `<img src="${escapeHtml(
            produto.image
          )}" alt="" style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid #f1f5f9"/>`
        : `<span style="width:34px;height:34px;border-radius:8px;background:#f3f4f6;flex-shrink:0"></span>`;
      return (
        `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #f3f4f6">` +
        thumb +
        `<span style="flex:1;min-width:0;font-size:12px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(
          produto.productName ?? "Produto"
        )}<span style="color:#9ca3af"> ×${produto.quantity ?? 0}</span></span>` +
        `<span style="font-size:12px;font-weight:600;color:#111827">${escapeHtml(
          formatKwanza(Number(produto.totalItem ?? 0))
        )}</span>` +
        `</div>`
      );
    })
    .join("");
  const moreCount = (order.produtos?.length ?? 0) - items.length;
  const moreHtml =
    moreCount > 0
      ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">+${moreCount} produto(s)</p>`
      : "";

  const rows: string[] = [];
  rows.push(
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">` +
      `<p style="margin:0;font-size:13px;font-weight:700;color:#111827">${escapeHtml(
        order.orderNumber ?? "Pedido"
      )}</p>` +
      `<span style="display:inline-block;padding:2px 8px;border:1px solid ${color};border-radius:999px;background:${color}14;color:${color};font-size:11px;font-weight:600;white-space:nowrap">${escapeHtml(
        label
      )}</span>` +
      `</div>`
  );
  rows.push(
    `<p style="margin:6px 0 0;font-size:12px;color:#374151">Cliente: ${escapeHtml(
      userLabel(order.user)
    )}</p>`
  );
  if (addressText) {
    rows.push(
      `<p style="margin:2px 0 0;font-size:12px;color:#374151">Morada: ${escapeHtml(
        addressText
      )}</p>`
    );
  }
  if (itemsHtml) {
    rows.push(`<div style="margin-top:6px">${itemsHtml}${moreHtml}</div>`);
  }
  rows.push(
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb">` +
      `<span style="font-size:12px;color:#6b7280">Total</span>` +
      `<span style="font-size:14px;font-weight:700;color:#111827">${escapeHtml(
        formatKwanza(orderTotal(order))
      )}</span>` +
      `</div>`
  );
  if (route) {
    rows.push(
      `<div style="margin-top:6px;padding:8px 10px;border-radius:10px;background:#f9fafb;border:1px solid #f1f5f9">` +
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">` +
        `<span style="font-size:11px;color:#6b7280">Rota até cliente</span>` +
        `<span style="font-size:13px;font-weight:700;color:#ED5379">${escapeHtml(
          formatDuration(route.duration)
        )}</span>` +
        `</div>` +
        `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:2px">` +
        `<span style="font-size:11px;color:#6b7280">Distância</span>` +
        `<span style="font-size:12px;font-weight:600;color:#111827">${escapeHtml(
          formatDistance(route.distance)
        )}${route.fallback ? " (aprox.)" : ""}</span>` +
        `</div>` +
        `</div>`
    );
  }
  rows.push(
    `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af">${escapeHtml(
      formatDate(order.createdAt)
    )} · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}</p>`
  );
  rows.push(
    `<a href="${mapsUrl}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#ED5379;text-decoration:none">Abrir rota no Google Maps &rarr;</a>`
  );

  return `<div style="min-width:220px;line-height:1.4;font-family:inherit">${rows.join(
    ""
  )}</div>`;
}

export function MapaPedidos({
  orders,
  className,
}: {
  orders: MapOrder[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<LLayerGroup | null>(null);
  const routesRef = useRef<LLayerGroup | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [store, setStore] = useState<Coordinates>(STORE_FALLBACK);
  const [routes, setRoutes] = useState<Record<string, RouteInfo>>({});
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const points = useMemo(() => {
    return orders
      .map((order) => ({
        order,
        coords: parseCoordinates(deliveryAddress(order)?.coordinates),
      }))
      .filter(
        (p): p is { order: MapOrder; coords: Coordinates } => p.coords !== null
      );
  }, [orders]);

  const presentStatuses = useMemo(() => {
    const seen = new Set<string>();
    for (const { order } of points) {
      seen.add((order.status ?? "").toLowerCase());
    }
    return Array.from(seen);
  }, [points]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!BASE_URL) return;
      try {
        const tokenRaw =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const token = tokenRaw ? sanitizeBearerToken(tokenRaw) : "";
        const res = await fetch(`${BASE_URL}/coordinates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: { latitude?: unknown; longitude?: unknown };
          latitude?: unknown;
          longitude?: unknown;
        };
        const data = json.data ?? json;
        const coords = normalizeCoords(data.latitude, data.longitude);
        if (!cancelled && coords) setStore(coords);
      } catch {
        // mantém STORE_FALLBACK
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (points.length === 0) {
      setRoutes({});
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setLoadingRoutes(true);

    (async () => {
      const list = await mapWithConcurrency(
        points,
        ROUTE_CONCURRENCY,
        async ({ order, coords }) => ({
          id: order._id,
          route: await fetchRoute(store, coords, controller.signal),
        })
      );
      if (cancelled) return;
      const next: Record<string, RouteInfo> = {};
      for (const { id, route } of list) {
        if (route) next[id] = route;
      }
      setRoutes(next);
      setLoadingRoutes(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
      setLoadingRoutes(false);
    };
  }, [points, store]);

  useEffect(() => {
    if (mapRef.current || failed) return;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("leaflet");
        const L = ((mod as { default?: LeafletNS }).default ??
          mod) as LeafletNS;
        if (cancelled || !containerRef.current || mapRef.current) return;

        leafletRef.current = L;

        const map = L.map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const routeLayer = L.layerGroup().addTo(map);
        const layer = L.layerGroup().addTo(map);

        mapRef.current = map;
        markersRef.current = layer;
        routesRef.current = routeLayer;
        setReady(true);
        window.setTimeout(() => map.invalidateSize(), 150);
      } catch (err) {
        console.error("Erro ao carregar o mapa:", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
        routesRef.current = null;
        leafletRef.current = null;
        setReady(false);
      }
    };
  }, [failed]);

  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = markersRef.current;
    const routeLayer = routesRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    routeLayer?.clearLayers();
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }

    const bounds = L.latLngBounds([]);
    const storeLatLng = L.latLng(store.lat, store.lng);

    for (const { order, coords } of points) {
      const route = routes[order._id];
      const key = (order.status ?? "").toLowerCase();
      const color = STATUS_COLORS[key] ?? "#6b7280";
      const latlng = L.latLng(coords.lat, coords.lng);

      if (routeLayer && route && route.geometry.length >= 2) {
        const line = L.polyline(route.geometry, {
          color,
          weight: 3,
          opacity: 0.65,
          dashArray: route.fallback ? "6 8" : undefined,
        }).addTo(routeLayer);
        line.bindTooltip(
          `${order.orderNumber ?? "Pedido"} · ${formatDuration(
            route.duration
          )} · ${formatDistance(route.distance)}`,
          { sticky: true }
        );
      }

      const icon = L.divIcon({
        className: "",
        html: pinSvg(color),
        iconSize: [26, 36],
        iconAnchor: [13, 34],
        popupAnchor: [0, -30],
      });

      const marker = L.marker(latlng, {
        icon,
        title: order.orderNumber ?? "Pedido",
        alt: order.orderNumber ?? "Pedido",
      }).addTo(layer);
      marker.bindPopup(popupHtml(order, coords, route, store), {
        maxWidth: 300,
      });
      bounds.extend(latlng);
    }

    const storeIcon = L.divIcon({
      className: "",
      html: storePinSvg(),
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    });
    L.marker(storeLatLng, { icon: storeIcon, title: "Loja", alt: "Loja" })
      .addTo(layer)
      .bindPopup(
        `<div style="font-size:12px;line-height:1.4"><strong>Loja</strong><br/>Casa Cheia<br/><span style="color:#9ca3af">${store.lat.toFixed(
          5
        )}, ${store.lng.toFixed(5)}</span></div>`
      );
    bounds.extend(storeLatLng);

    if (points.length === 1) {
      map.fitBounds(bounds.pad(0.25), { maxZoom: 15, animate: false });
    } else {
      map.fitBounds(bounds.pad(0.2), { maxZoom: 15, animate: false });
    }
    map.invalidateSize();
  }, [ready, points, routes, store]);

  const routeSummary = useMemo(() => {
    return points
      .map((point) => ({
        point,
        route: routes[point.order._id],
      }))
      .sort((a, b) => (a.route?.duration ?? Infinity) - (b.route?.duration ?? Infinity));
  }, [points, routes]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ED5379]/10 text-[#ED5379]">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Localização dos Pedidos
            </h3>
            <p className="text-xs text-gray-500">
              {points.length} de {orders.length} pedido
              {orders.length === 1 ? "" : "s"} com localização
              {loadingRoutes && (
                <span className="ml-2 inline-flex items-center gap-1 text-[#ED5379]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  a calcular rotas
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <svg width="14" height="14" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="16" fill="#111827" />
              <path
                d="M10 15l7-5 7 5v8a1 1 0 0 1-1 1h-4v-5h-4v5h-4a1 1 0 0 1-1-1z"
                fill="#ffffff"
              />
            </svg>
            Loja
          </span>
          {presentStatuses.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[key] ?? "#6b7280" }}
              />
              {STATUS_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "relative",
          className ?? "h-[360px] md:h-[440px]"
        )}
      >
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />

        {!ready && !failed && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar mapa...
            </div>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-50 px-6 text-center">
            <p className="text-sm text-gray-500">
              Não foi possível carregar o mapa OpenStreetMap.
            </p>
          </div>
        )}

        {ready && points.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] mx-auto w-fit rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-medium text-yellow-700 shadow-sm">
            Nenhum pedido desta lista tem coordenadas de localização registadas.
          </div>
        )}
      </div>

      {points.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <RouteIcon className="h-4 w-4 text-[#ED5379]" />
            <h4 className="text-sm font-semibold text-gray-700">
              Rota e tempo estimado a partir da loja
            </h4>
            {loadingRoutes && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {routeSummary.map(({ point, route }) => (
              <div
                key={point.order._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-800">
                    {point.order.orderNumber ?? "Pedido"}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">
                    {userLabel(point.order.user)} ·{" "}
                    {formatAddress(deliveryAddress(point.order)) || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {route ? (
                    <>
                      <p className="inline-flex items-center gap-1 text-sm font-bold text-[#ED5379]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(route.duration)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatDistance(route.distance)}
                        {route.fallback ? " aprox." : ""}
                      </p>
                    </>
                  ) : (
                    <Loader2
                      className={cn(
                        "h-4 w-4 text-gray-400",
                        loadingRoutes && "animate-spin"
                      )}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
