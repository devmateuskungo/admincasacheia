"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BASE_URL } from "@/lib/api";
import { formatKwanza } from "@/lib/currency";

export interface BellNotificationData {
  orderId?: string;
  orderNumber?: string;
  total?: number;
  contactName?: string;
}

export interface BellNotification {
  _id: string;
  user: string;
  type: string;
  title: string;
  body: string;
  data: BellNotificationData | null;
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  status: boolean;
  data?: BellNotification[];
}

const POLL_INTERVAL_MS = 10_000;

function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.4);
  } catch {
    /* ignore — audio is best-effort */
  }
}

function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function typeColor(type: string): string {
  switch (type) {
    case "new_order":
      return "bg-blue-100 text-blue-600";
    case "payment":
      return "bg-green-100 text-green-600";
    case "stock":
      return "bg-amber-100 text-amber-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function orderIcon(type: string): React.ReactNode {
  switch (type) {
    case "new_order":
      return <Package className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<BellNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const baselineReady = useRef(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    const token = getToken();
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/profile/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return;

      const result = (await response.json()) as NotificationResponse;
      const list = Array.isArray(result.data) ? result.data : [];
      const prevKnown = knownIds.current;

      setNotifications(list);

      const fresh = list.filter((n) => !prevKnown.has(n._id));

      if (baselineReady.current && !silent) {
        for (const notif of fresh) {
          if (notif.type === "new_order") {
            const contact = notif.data?.contactName;
            const orderNumber = notif.data?.orderNumber;
            const total = notif.data?.total;
            playNotificationSound();
            toast(
              contact
                ? `Novo pedido de ${contact}`
                : "Novo pedido recebido",
              {
                icon: <ShoppingBag className="h-4 w-4 text-[#ED5379]" />,
                description: orderNumber
                  ? `${orderNumber}${typeof total === "number" ? ` · ${formatKwanza(total)}` : ""}`
                  : undefined,
                action: {
                  label: "Ver pedidos",
                  onClick: () => {
                    window.location.href = "/dashbord/pedidos";
                  },
                },
              }
            );
          }
        }
      }

      for (const n of list) knownIds.current.add(n._id);
      baselineReady.current = true;
    } catch {
      // silencioso — o bell não deve interromper a navegação se a API falhar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  const markAsRead = async (notif: BellNotification) => {
    if (notif.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
    );
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

  const unread = notifications.filter((n) => !n.read);
  const unreadCount = unread.length;
  const recent = notifications.slice(0, 6);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu onOpenChange={(open) => { if (open) fetchNotifications(false); }}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full border bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5379]"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED5379] px-1.5 text-[11px] font-bold text-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="mt-1 w-80 max-h-[70vh] overflow-y-auto p-0"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <DropdownMenuLabel className="p-0">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#ED5379] text-white font-medium">
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>
            <button
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="text-xs font-medium text-[#ED5379] hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {markingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Marcar todas
            </button>
          </div>

          <DropdownMenuSeparator />

          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 px-4">
              <BellOff className="h-6 w-6 mb-2" />
              <p className="text-sm">Sem notificações</p>
            </div>
          ) : (
            <div className="py-1">
              {recent.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => markAsRead(notif)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColor(notif.type)}`}
                  >
                    {orderIcon(notif.type)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      {!notif.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#ED5379]" />
                      )}
                      <span
                        className={`truncate text-sm ${notif.read ? "text-gray-600" : "font-semibold text-gray-800"}`}
                      >
                        {notif.title || notif.type}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-gray-500 mt-0.5">
                      {notif.body}
                    </span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </span>
                </button>
              ))}

              <DropdownMenuSeparator />

              <Link
                href="/dashbord/notificacoes"
                className="flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium text-[#ED5379] hover:bg-gray-50 transition-colors"
              >
                Ver todas as notificações
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}