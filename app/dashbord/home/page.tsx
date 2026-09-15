"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { ChartPedidos } from "@/components/chart-pedidos/chartpedidos";
import { formatKwanza } from "@/lib/currency";
import { BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

type HomeOrder = {
  _id?: string;
  createdAt?: string;
  orderNumber?: string;
  status?: string;
  user?: string | { name?: string };
  resumoFinanceiro?: { total?: number };
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isWithinRange(value: Date, start: Date, end: Date): boolean {
  return value >= start && value <= end;
}

function percentChange(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return ((today - yesterday) / yesterday) * 100;
}

function resolveUserName(user: HomeOrder["user"]): string {
  if (!user) return "";
  if (typeof user === "string") return user.trim();
  return user.name?.trim() ?? "";
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(".", ",")}%`;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const min = Math.max(0, Math.floor(diffMs / 60_000));
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  if (hour < 24) return `há ${hour}h`;
  if (day < 7) return `há ${day} dia${day > 1 ? "s" : ""}`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  canceled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

function DeltaBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        up ? "text-green-600" : "text-red-600"
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {formatPercent(value)} <span className="font-normal text-gray-400">vs. ontem</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  children,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tint
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </article>
  );
}

export default function Home() {
  const [orders, setOrders] = useState<HomeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setOrders([]);
          return;
        }

        const response = await fetch(`${BASE_URL}/orders/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          setOrders([]);
          return;
        }

        const result = await response.json();
        setOrders(Array.isArray(result?.data) ? result.data : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem("user");
        const u = raw ? (JSON.parse(raw) as { name?: string }) : null;
        setUserName(u?.name?.trim() ?? "");
      } catch {
        setUserName("");
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStart = startOfDay(yesterdayDate);
    const yesterdayEnd = endOfDay(yesterdayDate);

    const todayOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const createdAt = new Date(order.createdAt);
      return !Number.isNaN(createdAt.getTime()) && isWithinRange(createdAt, todayStart, todayEnd);
    });

    const yesterdayOrders = orders.filter((order) => {
      if (!order.createdAt) return false;
      const createdAt = new Date(order.createdAt);
      return !Number.isNaN(createdAt.getTime()) && isWithinRange(createdAt, yesterdayStart, yesterdayEnd);
    });

    const pedidosHoje = todayOrders.length;
    const pedidosOntem = yesterdayOrders.length;
    const pedidosDiff = percentChange(pedidosHoje, pedidosOntem);

    const faturamentoHoje = todayOrders.reduce(
      (sum, order) => sum + Number(order.resumoFinanceiro?.total ?? 0),
      0
    );
    const faturamentoOntem = yesterdayOrders.reduce(
      (sum, order) => sum + Number(order.resumoFinanceiro?.total ?? 0),
      0
    );
    const faturamentoDiff = percentChange(faturamentoHoje, faturamentoOntem);

    const horaAtual = Math.max(now.getHours() + 1, 1);
    const mediaPedidosHora = pedidosHoje / horaAtual;
    const ticketMedio = pedidosHoje > 0 ? faturamentoHoje / pedidosHoje : 0;

    const preparando = orders.filter((o) =>
      ["pending", "confirmed"].includes((o.status ?? "").toLowerCase())
    ).length;
    const entregando = orders.filter((o) => (o.status ?? "").toLowerCase() === "shipped").length;

    const allUsers = new Set(
      orders.map((order) => resolveUserName(order.user)).filter(Boolean)
    );
    const todayUsers = new Set(
      todayOrders.map((order) => resolveUserName(order.user)).filter(Boolean)
    );

    return {
      pedidosHoje,
      pedidosDiff,
      mediaPedidosHora,
      faturamentoHoje,
      faturamentoDiff,
      ticketMedio,
      preparando,
      entregando,
      emAndamento: preparando + entregando,
      clientesAtivos: allUsers.size,
      novosHoje: todayUsers.size,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .filter((o) => o.createdAt)
      .sort(
        (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      )
      .slice(0, 6);
  }, [orders]);

  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? "Bom dia" : hours < 18 ? "Boa tarde" : "Boa noite";
  const firstName = userName.split(/\s+/)[0] || "Admin";
  const todayLabel = now.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusChip = (status?: string) => (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        STATUS_STYLES[(status ?? "").toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200"
      )}
    >
      {STATUS_LABELS[(status ?? "").toLowerCase()] ?? status ?? "—"}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm capitalize text-gray-500">{todayLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashbord/categorias"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#ED5379]/40 hover:bg-gray-50"
          >
            <Tag className="h-4 w-4 text-[#ED5379]" />
            Nova Categoria
          </Link>
          <Link
            href="/dashbord/product"
            className="inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#ED5379]/20 transition hover:bg-[#f11f54]"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos Hoje"
          value={loading ? "..." : metrics.pedidosHoje}
          icon={ShoppingBag}
          tint="bg-blue-50 text-blue-600"
        >
          <div className="flex items-center justify-between gap-2">
            <DeltaBadge value={metrics.pedidosDiff} />
            <span className="text-xs text-gray-400">
              {loading ? "..." : `${metrics.mediaPedidosHora.toFixed(1).replace(".", ",")} ped/h`}
            </span>
          </div>
        </StatCard>

        <StatCard
          label="Faturamento Dia"
          value={loading ? "..." : formatKwanza(metrics.faturamentoHoje)}
          icon={DollarSign}
          tint="bg-green-50 text-green-600"
        >
          <div className="flex items-center justify-between gap-2">
            <DeltaBadge value={metrics.faturamentoDiff} />
            <span className="text-xs text-gray-400">
              Ticket {loading ? "..." : formatKwanza(metrics.ticketMedio)}
            </span>
          </div>
        </StatCard>

        <StatCard
          label="Em Andamento"
          value={loading ? "..." : metrics.emAndamento}
          icon={Truck}
          tint="bg-amber-50 text-amber-600"
        >
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
              <Clock className="h-3 w-3" />
              {loading ? "..." : metrics.preparando} preparando
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              <Truck className="h-3 w-3" />
              {loading ? "..." : metrics.entregando} a entregar
            </span>
          </div>
        </StatCard>

        <StatCard
          label="Clientes Ativos"
          value={loading ? "..." : metrics.clientesAtivos}
          icon={Users}
          tint="bg-purple-50 text-purple-600"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-purple-600">
              +{loading ? "..." : metrics.novosHoje} novos hoje
            </span>
            <span className="text-xs text-gray-400">total</span>
          </div>
        </StatCard>
      </div>

      {/* Gráfico + Pedidos recentes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900">Pedidos nos Últimos Meses</h2>
            <p className="text-sm text-gray-500">
              Evolução mensal de pedidos e itens vendidos para acompanhar tendências de vendas.
            </p>
          </div>
          <div className="mt-4">
            <ChartPedidos />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Pedidos Recentes</h2>
            <Link
              href="/dashbord/pedidos"
              className="text-sm font-medium text-[#ED5379] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-2/3 rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Package className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Ainda não há pedidos.</p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <li key={order._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ED5379]/10 text-[#ED5379]">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {order.orderNumber || "Pedido"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {resolveUserName(order.user) || "Cliente"} ·{" "}
                        {formatRelativeTime(order.createdAt as string)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {formatKwanza(Number(order.resumoFinanceiro?.total ?? 0))}
                    </p>
                    <div className="mt-1">{statusChip(order.status)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}