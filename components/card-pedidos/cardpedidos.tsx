"use client"
import { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Tag, 
  DollarSign, 
  Hash, 
  AlertCircle, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  RotateCcw,
  Truck,
  CheckSquare
} from "lucide-react";
import { BASE_URL } from '@/lib/api';
import { formatKwanza } from '@/lib/currency';

interface Produto {
  price: number;
  quantity: number;
  productName?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  user: string;
  produtos: Produto[];
  updatedAt?: string;
  createdAt?: string;
}

function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

export function OrdersProductsList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
      } else if (result.status && result.data) {
        setOrders(result.data);
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
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      setUpdateMessage(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('Token não encontrado');
      }

      // ATUALIZADO: Usando método PATCH com a rota correta /id/status
      const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH', // ATUALIZADO: Mudado de PUT para PATCH
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar status: ${response.status}`);
      }

      // Atualiza o estado local
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } 
            : order
        )
      );

      setUpdateMessage({
        type: 'success',
        text: `Status alterado para ${formatStatus(newStatus)} com sucesso!`
      });

      // Remove a mensagem após 3 segundos
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);

    } catch (err: unknown) {
      console.error('Erro ao atualizar status:', err);
      setUpdateMessage({
        type: 'error',
        text: messageFromUnknown(err, 'Erro ao atualizar status'),
      });
      
      // Recarrega os pedidos para garantir sincronização
      fetchOrders();
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Cálculo de estatísticas
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProducts = orders.reduce((sum, order) => sum + order.produtos.length, 0);
  const totalItems = orders.reduce((sum, order) => 
    sum + order.produtos.reduce((prodSum, prod) => prodSum + prod.quantity, 0), 0
  );
  const productsWithoutName = orders.reduce((sum, order) => 
    sum + order.produtos.filter(p => !p.productName).length, 0
  );

  // Contar pedidos por status
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
  const shippedOrders = orders.filter(order => order.status === 'shipped').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const canceledOrders = orders.filter(order => order.status === 'canceled').length;

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckSquare className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendente', icon: <Clock className="h-4 w-4" /> },
    { value: 'confirmed', label: 'Confirmado', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'shipped', label: 'Enviado', icon: <Truck className="h-4 w-4" /> },
    { value: 'delivered', label: 'Entregue', icon: <CheckSquare className="h-4 w-4" /> },
    { value: 'canceled', label: 'Cancelado', icon: <XCircle className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Carregando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

  return (
    <div className="space-y-6">
      {/* Mensagem de atualização */}
      {updateMessage && (
        <div className={`p-4 rounded-lg border ${
          updateMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {updateMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p>{updateMessage.text}</p>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">Total Pedidos</p>
          <p className="text-xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">Pendentes</p>
          <p className="text-xl font-bold">{pendingOrders}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">Confirmados</p>
          <p className="text-xl font-bold">{confirmedOrders}</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-700">Enviados</p>
          <p className="text-xl font-bold">{shippedOrders}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Entregues</p>
          <p className="text-xl font-bold">{deliveredOrders}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">Cancelados</p>
          <p className="text-xl font-bold">{canceledOrders}</p>
        </div>
      </div>

      {/* Botão de recarregar */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {orders.length} pedidos encontrados
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Atualizar Lista
        </button>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order._id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Cabeçalho do Card */}
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                      <h3 className="font-bold text-gray-800">{order.orderNumber}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Usuário: {order.user.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatKwanza(order.total)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{order.produtos?.length || 0} produtos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    {/* Select para alterar status */}
                    <div className="w-full md:w-auto">
                      <div className="flex gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingStatus === order._id}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                            getStatusColor(order.status)
                          } ${updatingStatus === order._id ? 'opacity-70' : 'hover:opacity-90'}`}
                        >
                          {statusOptions.map((option) => (
                            <option 
                              key={option.value} 
                              value={option.value}
                              className="bg-white text-gray-800"
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                        
                        {updatingStatus === order._id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 my-auto"></div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <button
                        onClick={() => toggleOrder(order._id)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <span>
                          {expandedOrder === order._id ? 'Recolher' : 'Ver detalhes'}
                        </span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedOrder === order._id ? 'transform rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do Pedido (expandido) */}
              {expandedOrder === order._id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos do Pedido ({order.produtos?.length || 0})
                    </h4>
                    
                    {order.produtos && order.produtos.length > 0 ? (
                      <div className="space-y-3">
                        {order.produtos.map((produto, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg border ${
                              produto.productName 
                                ? 'bg-white border-gray-200' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {!produto.productName && (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  <p className={`font-medium ${
                                    produto.productName 
                                      ? 'text-gray-800' 
                                      : 'text-yellow-700'
                                  }`}>
                                    {produto.productName || 'Produto sem nome'}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span>Preço: {formatKwanza(produto.price ?? 0)}/un</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    <span>Quantidade: {produto.quantity || 0} unid.</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right ml-4">
                                <p className="font-bold text-lg">
                                  {formatKwanza((produto.price || 0) * (produto.quantity || 0))}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Total
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Nenhum produto neste pedido
                      </div>
                    )}
                  </div>

                  {/* Resumo do Pedido */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-2">Resumo do Pedido</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-600">Subtotal Produtos:</p>
                        <p className="font-bold">
                          {formatKwanza(
                            order.produtos?.reduce(
                              (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
                              0
                            ) ?? 0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Total do Pedido:</p>
                        <p className="font-bold text-lg">{formatKwanza(order.total ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Quantidade de Itens:</p>
                        <p className="font-bold">
                          {order.produtos?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0} unid.
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-blue-600">Status Atual:</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {formatStatus(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data do pedido */}
                  {(order.createdAt || order.updatedAt) && (
                    <div className="mt-4 text-xs text-gray-500 text-right">
                      {order.createdAt && (
                        <p>Criado em: {new Date(order.createdAt).toLocaleString('pt-PT')}</p>
                      )}
                      {order.updatedAt && (
                        <p>Última atualização: {new Date(order.updatedAt).toLocaleString('pt-PT')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-500 mb-4">Não há pedidos para exibir no momento.</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}