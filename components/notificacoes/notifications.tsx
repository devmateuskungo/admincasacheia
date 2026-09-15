"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CreditCard,
  Inbox,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { BASE_URL } from "@/lib/api";
import { formatKwanza } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface NotificationData {
  orderId?: string;
  orderNumber?: string;
  total?: number;
  contactName?: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  type: string;
  title: string;
  body: string;
  data: NotificationData | null;
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  status: boolean;
  data?: NotificationItem[];
}

const TYPE_LABELS: Record<string, string> = {
  new_order: "Novo Pedido",
  order_status: "Status de Pedido",
  payment: "Pagamento",
  stock: "Estoque",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  new_order: ShoppingBag,
  order_status: Truck,
  payment: CreditCard,
  stock: Package,
};

const TYPE_COLORS: Record<string, string> = {
  new_order: "bg-blue-50 text-blue-600",
  order_status: "bg-indigo-50 text-indigo-600",
  payment: "bg-green-50 text-green-600",
  stock: "bg-amber-50 text-amber-600",
};

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  if (hour < 24) return `há ${hour}h`;
  if (day < 7) return `há ${day} dia${day > 1 ? "s" : ""}`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function formatFullDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setError("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch(`${BASE_URL}/profile/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar notificações (${response.status})`);
      }

      const result = (await response.json()) as NotificationResponse;

      if (result && Array.isArray(result.data)) {
        setNotifications(result.data);
      } else {
        setNotifications([]);
      }
    } catch (err: unknown) {
      console.error("Erro:", err);
      setError(messageFromUnknown(err, "Erro ao carregar notificações"));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notif: NotificationItem) => {
    if (notif.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
    );
    setMarkingId(notif._id);
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`${BASE_URL}/profile/notifications/${notif._id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: notif.read } : n))
      );
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.every((n) => n.read)) return;
    setMarkingAll(true);
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`${BASE_URL}/profile/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
      setNotifications(previous);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`${BASE_URL}/profile/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Erro ao apagar notificação:", err);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;
  const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;
  const IconFor = (type: string) => TYPE_ICONS[type] ?? Bell;
  const typeColor = (type: string) => TYPE_COLORS[type] ?? "bg-gray-50 text-gray-600";

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      return (
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        typeLabel(n.type).toLowerCase().includes(q) ||
        (n.data?.contactName ?? "").toLowerCase().includes(q) ||
        (n.data?.orderNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [notifications, searchQuery]);

  const hasFilters = searchQuery !== "";

  const statCards = [
    {
      label: "Total",
      value: notifications.length,
      icon: Bell,
      tint: "bg-blue-50 text-blue-600",
    },
    {
      label: "Não lidas",
      value: unreadCount,
      icon: Bell,
      tint: "bg-[#ED5379]/10 text-[#ED5379]",
    },
    {
      label: "Lidas",
      value: readCount,
      icon: CheckCheck,
      tint: "bg-green-50 text-green-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="mt-2 h-6 w-10" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs rounded-lg" />
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-44 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-gray-100 bg-white p-4 pl-5 shadow-sm sm:p-5 sm:pl-6"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Erro ao carregar notificações</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", s.tint)}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar notificações..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-sm text-gray-500">
            {filteredNotifications.length} de {notifications.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ED5379]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Marcar todas como lidas
            </button>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const NotifIcon = IconFor(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => markAsRead(notif)}
                className={cn(
                  "group relative flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer",
                  notif.read
                    ? "border-gray-100"
                    : "border-[#ED5379]/30 bg-[#ED5379]/[0.02]"
                )}
              >
                {!notif.read && <span className="absolute inset-y-0 left-0 w-1 bg-[#ED5379]" />}

                <div className="min-w-0 flex-1 p-4 pl-5 sm:p-5 sm:pl-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        typeColor(notif.type)
                      )}
                    >
                      <NotifIcon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-semibold text-gray-900">
                            {notif.title || typeLabel(notif.type)}
                          </span>
                          <span className="hidden rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 sm:inline-flex">
                            {typeLabel(notif.type)}
                          </span>
                        </div>
                        <span
                          className="text-xs text-gray-400 cursor-default"
                          title={formatFullDate(notif.createdAt)}
                        >
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">{notif.body}</p>

                      {notif.data && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {notif.data.contactName && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                              <span className="text-gray-400">Cliente:</span>
                              <strong>{notif.data.contactName}</strong>
                            </span>
                          )}
                          {notif.data.orderNumber && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                              <span className="text-gray-400">Pedido:</span>
                              <strong>{notif.data.orderNumber}</strong>
                            </span>
                          )}
                          {typeof notif.data.total === "number" && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                              <span className="text-gray-400">Total:</span>
                              <strong>{formatKwanza(notif.data.total)}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {!notif.read && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ED5379]">
                              {markingId === notif._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#ED5379]" />
                              )}
                              Não lida
                            </span>
                          )}
                          {notif.data?.orderId && (
                            <Link
                              href="/dashbord/pedidos"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                            >
                              Ver pedido
                            </Link>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif._id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Apagar notificação"
                          aria-label="Apagar notificação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">
            {hasFilters ? "Nenhum resultado para a pesquisa" : "Nenhuma notificação"}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {hasFilters
              ? "Tente ajustar os termos da pesquisa."
              : "Quando houver novos pedidos ou atividades, elas aparecerão aqui."}
          </p>
          {hasFilters && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54]"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar pesquisa
            </button>
          )}
        </div>
      )}
    </div>
  );
}