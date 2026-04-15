 "use client";

import { useEffect, useMemo, useState } from 'react';
import { ChartPedidos } from '@/components/chart-pedidos/chartpedidos';
import { formatKwanza } from '@/lib/currency';
import { BASE_URL } from '@/lib/api';
import Link from 'next/link';

type HomeOrder = {
    createdAt?: string;
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

function resolveUserName(user: HomeOrder['user']): string {
    if (!user) return '';
    if (typeof user === 'string') return user.trim();
    return user.name?.trim() ?? '';
}

export default function Home() {
    const [orders, setOrders] = useState<HomeOrder[]>([]);
    const [loading, setLoading] = useState(true);

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

        const faturamentoHoje = todayOrders.reduce((sum, order) => sum + Number(order.resumoFinanceiro?.total ?? 0), 0);
        const faturamentoOntem = yesterdayOrders.reduce((sum, order) => sum + Number(order.resumoFinanceiro?.total ?? 0), 0);
        const faturamentoDiff = percentChange(faturamentoHoje, faturamentoOntem);

        const horaAtual = Math.max(now.getHours() + 1, 1);
        const mediaPedidosHora = pedidosHoje / horaAtual;
        const ticketMedio = pedidosHoje > 0 ? faturamentoHoje / pedidosHoje : 0;

        const preparando = orders.filter((o) => ['pending', 'confirmed'].includes((o.status ?? '').toLowerCase())).length;
        const entregando = orders.filter((o) => (o.status ?? '').toLowerCase() === 'shipped').length;
        const emAndamento = preparando + entregando;

        const allUsers = new Set(
            orders
                .map((order) => resolveUserName(order.user))
                .filter(Boolean)
        );
        const todayUsers = new Set(
            todayOrders
                .map((order) => resolveUserName(order.user))
                .filter(Boolean)
        );

        return {
            pedidosHoje,
            pedidosDiff,
            mediaPedidosHora,
            faturamentoHoje,
            faturamentoDiff,
            ticketMedio,
            emAndamento,
            preparando,
            entregando,
            clientesAtivos: allUsers.size,
            novosHoje: todayUsers.size,
        };
    }, [orders]);

    const formatPercent = (value: number) => `${Math.abs(value).toFixed(1).replace('.', ',')}%`;
    const diffClass = (value: number) => (value >= 0 ? 'text-green-600' : 'text-red-600');
    const diffArrow = (value: number) => (value >= 0 ? '↑' : '↓');

    return (
        <div>
            <div className="flex items-center justify-between mt-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-400 mt-2">Visão geral das atividades recentes</p>
                    <p className="text-xs text-gray-500 mt-1">Valores monetários em Kwanza (AOA).</p>
                </div>

                <div className="flex gap-4">
                    <Link href="/dashbord/categorias" className="px-4 py-2 border border-gray-300 text-[#ED5379] rounded-md transition">
                        Nova Categoria
                    </Link>
                    <Link href="/dashbord/product" className="px-4 py-2 bg-[#ED5379] text-white rounded-md hover:bg-[#f11f54] transition">
                        Novo Produtos
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* Total de Pedidos */}
                <article className="min-w-55 rounded-md border p-4 bg-white  ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pedidos Hoje</p>
                            <h2 className="text-2xl font-bold text-gray-800">{loading ? '...' : metrics.pedidosHoje}</h2>
                            <p className={`text-xs flex items-center ${diffClass(metrics.pedidosDiff)}`}>
                                <span className="mr-1">{diffArrow(metrics.pedidosDiff)} {formatPercent(metrics.pedidosDiff)}</span> vs. ontem
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>Média: {loading ? '...' : metrics.mediaPedidosHora.toFixed(1).replace('.', ',')} pedidos/hora</span>
                    </div>
                </article>

                {/* Faturamento */}
                <article className="min-w-55 rounded-md  p-4 bg-white border ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Faturamento Dia</p>
                            <h2 className="text-2xl font-bold text-gray-800">{loading ? '...' : formatKwanza(metrics.faturamentoHoje)}</h2>
                            <p className={`text-xs flex items-center ${diffClass(metrics.faturamentoDiff)}`}>
                                <span className="mr-1">{diffArrow(metrics.faturamentoDiff)} {formatPercent(metrics.faturamentoDiff)}</span> vs. ontem
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>Ticket médio: {loading ? '...' : formatKwanza(metrics.ticketMedio)}</span>
                    </div>
                </article>

                {/* Pedidos em Andamento */}
                <article className="min-w-55 rounded-md  p-4 bg-white border ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Em Andamento</p>
                            <h2 className="text-2xl font-bold text-gray-800">{loading ? '...' : metrics.emAndamento}</h2>
                            <div className="flex space-x-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">{loading ? '...' : metrics.preparando} preparando</span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{loading ? '...' : metrics.entregando} entregando</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-full bg-orange-100">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </article>

                {/* Clientes Ativos */}
                <article className="min-w-55 rounded-md border p-4 bg-white ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Clientes Ativos</p>
                            <h2 className="text-2xl font-bold text-gray-800">{loading ? '...' : metrics.clientesAtivos}</h2>
                            <p className="text-xs text-blue-600">+{loading ? '...' : metrics.novosHoje} novos hoje</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75V15m0 0h-3m3 0h3" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>87% taxa de retenção</span>
                    </div>
                </article>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Novos Pedidos */}


                <section className="flex-1 overflow-x-auto mt-10">

                    <h2 className="text-xl font-bold mb-2">
                        Pedidos nos Últimos Meses
                    </h2>
                    <p className="text-gray-500 mb-2">
                        Acompanhe a evolução mensal dos pedidos e dos itens vendidos para entender tendências de vendas,
                        planejar reposição de stock e apoiar decisões das equipas de operação e comercial.
                    </p>
                    {/* ChartPedidos component */}  
                    <ChartPedidos />

                </section>
                {/* Conteúdo principal */}

               

            </div>
        </div>


    )
}