import { ChartPedidos } from '@/components/chart-pedidos/chartpedidos';
import { formatKwanza } from '@/lib/currency';

export default function Home() {
    return (
        <div>
            <div className="flex items-center justify-between mt-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-400 mt-2">Visão geral das atividades recentes</p>
                    <p className="text-xs text-gray-500 mt-1">Valores monetários em Kwanza (AOA).</p>
                </div>

                <div className="flex gap-4">
                    <button className="px-4 py-2 border border-gray-300 text-[#ED5379] rounded-md  transition">
                        Nova Categoria
                    </button>
                    <button className="px-4 py-2 bg-[#ED5379] text-white rounded-md hover:bg-[#f11f54] transition">
                        Novo Produtos
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* Total de Pedidos */}
                <article className="min-w-55 rounded-md border p-4 bg-white  ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pedidos Hoje</p>
                            <h2 className="text-2xl font-bold text-gray-800">89</h2>
                            <p className="text-xs text-green-600 flex items-center">
                                <span className="mr-1">↑ 18%</span> vs. ontem
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>Média: 7,4 pedidos/hora</span>
                    </div>
                </article>

                {/* Faturamento */}
                <article className="min-w-55 rounded-md  p-4 bg-white border ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Faturamento Dia</p>
                            <h2 className="text-2xl font-bold text-gray-800">{formatKwanza(4285)}</h2>
                            <p className="text-xs text-green-600 flex items-center">
                                <span className="mr-1">↑ 12%</span> vs. ontem
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span>Ticket médio: {formatKwanza(48.15)}</span>
                    </div>
                </article>

                {/* Pedidos em Andamento */}
                <article className="min-w-55 rounded-md  p-4 bg-white border ">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Em Andamento</p>
                            <h2 className="text-2xl font-bold text-gray-800">14</h2>
                            <div className="flex space-x-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">6 preparando</span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">8 entregando</span>
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
                            <h2 className="text-2xl font-bold text-gray-800">142</h2>
                            <p className="text-xs text-blue-600">+8 novos hoje</p>
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
                    <p className="text-gray-500 mb-2">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tempore minus, quidem tenetur.?</p>
                    {/* ChartPedidos component */}  
                    <ChartPedidos />

                </section>
                {/* Conteúdo principal */}

               

            </div>
        </div>


    )
}