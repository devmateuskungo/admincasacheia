"use client"
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  Clock,
  Filter,
  Hash,
  Inbox,
  Loader2,
  Package,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Tag,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BASE_URL } from '@/lib/api';
import { formatKwanza } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface Produto {
  price?: number;
  unitPrice?: number;
  totalItem?: number;
  quantity: number;
  productName?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  total?: number;
  totalItens?: number;
  resumoFinanceiro?: {
    subtotal?: number;
    total?: number;
  };
  status: string;
  user: string | { name?: string };
  produtos: Produto[];
  updatedAt?: string;
  createdAt?: string;
}

type StatusFilter = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "canceled";

function orderUserLabel(user: Order['user']): string {
  if (user == null) return '—';
  if (typeof user === 'string') {
    const s = user.trim();
    if (!s) return '—';
    return s.length > 12 ? `${s.slice(0, 12)}…` : s;
  }
  const name = user.name?.trim();
  if (name) return name;
  return '—';
}

function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

function getUnitPrice(produto: Produto): number {
  return Number(produto.unitPrice ?? produto.price ?? 0);
}

function getItemTotal(produto: Produto): number {
  if (produto.totalItem != null) return Number(produto.totalItem);
  return getUnitPrice(produto) * Number(produto.quantity || 0);
}

function getOrderTotal(order: Order): number {
  return Number(order.resumoFinanceiro?.total ?? order.total ?? 0);
}

function getOrderSubtotal(order: Order): number {
  if (order.resumoFinanceiro?.subtotal != null) {
    return Number(order.resumoFinanceiro.subtotal);
  }
  return order.produtos?.reduce((sum, p) => sum + getItemTotal(p), 0) ?? 0;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  confirmed: <CheckCircle className="h-3.5 w-3.5" />,
  shipped: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckSquare className="h-3.5 w-3.5" />,
  canceled: <XCircle className="h-3.5 w-3.5" />,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  canceled: 'Cancelado',
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelado' },
];

function StatusBadge({ status }: { status: string }) {
  const key = (status ?? '').toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STATUS_STYLES[key] ?? 'bg-gray-50 text-gray-600 border-gray-200'
      )}
    >
      {STATUS_ICONS[key] ?? <Clock className="h-3.5 w-3.5" />}
      {STATUS_LABELS[key] ?? status}
    </span>
  );
}

export function OrdersProductsList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token de autenticação não encontrado");
        console.error("Token não encontrado");
        return;
      }

      const response = await fetch(`${BASE_URL}/orders/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos');
      }

      const result = await response.json();

      if (result && Array.isArray(result.data)) {
        setOrders(result.data);
      } else if (result && Array.isArray(result)) {
        setOrders(result);
      } else {
        setOrders([]);
      }
    } catch (err: unknown) {
      console.error('Erro:', err);
      setError(messageFromUnknown(err, 'Erro ao carregar pedidos'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        (order.orderNumber ?? '').toLowerCase().includes(q) ||
        orderUserLabel(order.user).toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || (order.status ?? '').toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const confirmOrder = async (orderId: string) => {
    try {
      setUpdatingStatus(orderId);
      setUpdateMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao confirmar pedido: ${response.status}`);
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, status: 'confirmed', updatedAt: new Date().toISOString() }
            : order
        )
      );

      setUpdateMessage({
        type: 'success',
        text: 'Pedido confirmado com sucesso!'
      });

      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao confirmar pedido:', err);
      setUpdateMessage({
        type: 'error',
        text: messageFromUnknown(err, 'Erro ao confirmar pedido'),
      });
      fetchOrders();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const stats = useMemo(() => {
    const pendingOrders = orders.filter((o) => (o.status ?? '').toLowerCase() === 'pending').length;
    const confirmedOrders = orders.filter((o) => (o.status ?? '').toLowerCase() === 'confirmed').length;
    const shippedOrders = orders.filter((o) => (o.status ?? '').toLowerCase() === 'shipped').length;
    const deliveredOrders = orders.filter((o) => (o.status ?? '').toLowerCase() === 'delivered').length;
    const canceledOrders = orders.filter((o) => (o.status ?? '').toLowerCase() === 'canceled').length;
    const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      total: orders.length,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      canceledOrders,
      totalRevenue,
      totalItems: orders.reduce(
        (sum, order) => sum + order.produtos.reduce((s, p) => s + (p.quantity || 0), 0),
        0
      ),
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
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
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <Skeleton className="h-9 w-full rounded-lg sm:max-w-xs" />
            <Skeleton className="h-9 w-52 rounded-lg" />
          </div>
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="ml-auto h-3 w-16" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-lg" />
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Erro ao carregar pedidos</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const gridStats = [
    { label: 'Total Pedidos', value: stats.total, icon: Receipt, tint: 'bg-blue-50 text-blue-600' },
    { label: 'Receita Total', value: formatKwanza(stats.totalRevenue), icon: Banknote, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pendentes', value: stats.pendingOrders, icon: Clock, tint: 'bg-yellow-50 text-yellow-600' },
    { label: 'Confirmados', value: stats.confirmedOrders, icon: CheckCircle, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Enviados', value: stats.shippedOrders, icon: Truck, tint: 'bg-indigo-50 text-indigo-600' },
    { label: 'Entregues', value: stats.deliveredOrders, icon: CheckSquare, tint: 'bg-green-50 text-green-600' },
    { label: 'Cancelados', value: stats.canceledOrders, icon: XCircle, tint: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Mensagem de atualização */}
      {updateMessage && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border p-3 text-sm',
            updateMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          {updateMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <p>{updateMessage.text}</p>
          <button
            onClick={() => setUpdateMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
            aria-label="Fechar mensagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {gridStats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.tint)}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className={cn('mt-1 font-bold text-gray-900', s.icon === Banknote ? 'text-lg' : 'text-xl')}>
              {s.value}
            </p>
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
              placeholder="Pesquisar por nº ou cliente..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative sm:w-52">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-sm text-gray-500">
            {filteredOrders.length} de {orders.length} pedidos
          </p>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const expanded = expandedOrder === order._id;
            return (
              <div
                key={order._id}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow',
                  expanded ? 'shadow-md ring-1 ring-[#ED5379]/20' : 'hover:shadow-md'
                )}
              >
                {/* Cabeçalho do card */}
                <div className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ED5379]/10 text-[#ED5379]">
                        <ShoppingBag className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {orderUserLabel(order.user)} · Criado em {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatKwanza(getOrderTotal(order))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.produtos?.length || 0} produto{order.produtos?.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      {order.status.toLowerCase() === 'pending' ? (
                      <button
                        onClick={() => confirmOrder(order._id)}
                        disabled={updatingStatus === order._id}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54] disabled:opacity-70"
                      >
                        {updatingStatus === order._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {updatingStatus === order._id ? 'A confirmar...' : 'Confirmar pedido'}
                      </button>
                    ) : null}

                      <button
                        onClick={() => toggleOrder(order._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Recolher' : 'Detalhes'}
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expanded && (
                  <div className="border-t bg-gray-50/60 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Package className="h-4 w-4" />
                      Produtos do Pedido ({order.produtos?.length || 0})
                    </h4>

                    {order.produtos && order.produtos.length > 0 ? (
                      <div className="space-y-2">
                        {order.produtos.map((produto, index) => (
                          <div
                            key={index}
                            className={cn(
                              'flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between',
                              produto.productName
                                ? 'bg-white border-gray-200'
                                : 'bg-yellow-50 border-yellow-200'
                            )}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              {!produto.productName && (
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                              )}
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    'truncate text-sm font-medium',
                                    produto.productName ? 'text-gray-800' : 'text-yellow-700'
                                  )}
                                >
                                  {produto.productName || 'Produto sem nome'}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {formatKwanza(getUnitPrice(produto))}/un
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Qtd: {produto.quantity || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-bold text-gray-900">
                                {formatKwanza(getItemTotal(produto))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-white py-8 text-center text-sm text-gray-500">
                        Nenhum produto neste pedido
                      </div>
                    )}

                    {/* Resumo */}
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-blue-500">Subtotal Produtos</p>
                          <p className="mt-0.5 font-bold text-gray-800">
                            {formatKwanza(getOrderSubtotal(order))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Total do Pedido</p>
                          <p className="mt-0.5 text-lg font-bold text-gray-900">
                            {formatKwanza(getOrderTotal(order))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Itens</p>
                          <p className="mt-0.5 font-bold text-gray-800">
                            {order.totalItens ??
                              (order.produtos?.reduce((s, p) => s + (p.quantity || 0), 0) || 0)}{' '}
                            unid.
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Status Atual</p>
                          <div className="mt-1.5">
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-0.5 text-right text-xs text-gray-400">
                      {order.createdAt && (
                        <p>Criado em: {formatDate(order.createdAt)}</p>
                      )}
                      {order.updatedAt && (
                        <p>Última atualização: {formatDate(order.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">
            {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum resultado para os filtros'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {orders.length === 0
              ? 'Não há pedidos para exibir no momento.'
              : 'Tente ajustar a pesquisa ou o filtro de status.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              fetchOrders();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54]"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar e tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}