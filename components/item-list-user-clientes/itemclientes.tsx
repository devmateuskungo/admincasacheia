"use client"
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FaWhatsapp, FaSync, FaExclamationTriangle, FaSearch, FaTimes } from "react-icons/fa";
import { BASE_URL } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  telefone: string;
  role: string;
  createdAt: string;
}

export default function ItemCliente() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Token não encontrado. Faça login novamente.");
        return;
      }

      const response = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Sessão expirada. Redirecionando para login...");
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status && result.data && Array.isArray(result.data)) {
        setUsers(result.data);
      } else {
        console.warn('Estrutura de dados inesperada:', result);
        setUsers([]);
      }

    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telefone?.includes(searchTerm)
  );

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, '');
    
    // Verifica se o número já tem código do país (Angola é 244)
    // Se tiver apenas 9 dígitos, assume que é número angolano
    if (cleaned.length === 9) {
      return `https://wa.me/244${cleaned}`;
    }
    
    // Se já tiver código do país, usa como está
    return `https://wa.me/${cleaned}`;
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return 'Não informado';
    
    // Formata para exibição: +244 XXX XXX XXX
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
      return `+244 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    
    return phone;
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED5379]"></div>
        <p className="text-gray-600">Carregando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Erro ao carregar clientes</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSync />
              Tentar novamente
            </button>
            {error.includes("Sessão expirada") && (
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Ir para login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
         
          <h2 className="text-gray-600">
            Total: {users.length} cliente{users.length !== 1 ? 's' : ''}
            {searchTerm && filteredUsers.length !== users.length && (
              <span className="text-blue-600 ml-2">
                ({filteredUsers.length} encontrado{filteredUsers.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED5379] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#ED5379] text-white rounded-lg hover:bg-[#d94a6c] transition-colors"
            title="Atualizar lista"
          >
            <FaSync />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          {searchTerm ? (
            <>
              <FaSearch className="mx-auto text-gray-400 text-3xl mb-3" />
              <p className="text-gray-500 text-lg">
                Nenhum cliente encontrado para 
              </p>
              <button
                onClick={clearSearch}
                className="mt-3 text-blue-600 hover:text-blue-800 hover:underline"
              >
                Limpar busca
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-lg">Nenhum cliente cadastrado</p>
              <button
                onClick={fetchUsers}
                className="mt-3 flex items-center gap-2 mx-auto text-blue-600 hover:text-blue-800"
              >
                <FaSync />
                Recarregar
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <Table>
            <TableCaption>
              Lista de clientes - Página 1 de 2 {/* Você pode dinâmizar isso com os dados do 'meta' */}
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700 py-3 px-4">Nome do Cliente</TableHead>
                <TableHead className="font-semibold text-gray-700 py-3 px-4">Telefone</TableHead>
                <TableHead className="font-semibold text-gray-700 py-3 px-4 text-center">WhatsApp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium py-3 px-4">
                    <div>
                      <span className="text-gray-800">{user.name}</span>
                      <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {user.role === 'user' ? 'Cliente' : user.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className="font-mono text-gray-700">
                      {formatPhoneDisplay(user.telefone)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {user.telefone ? (
                      <a
                        href={formatWhatsAppLink(user.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow"
                        title={`Conversar com ${user.name} no WhatsApp`}
                      >
                        <FaWhatsapp size={18} />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Sem telefone</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Estatísticas simples */}
      <div className="text-sm text-gray-500 flex justify-between items-center">
        <div>
          Mostrando {filteredUsers.length} de {users.length} cliente{users.length !== 1 ? 's' : ''}
        </div>
        <div className="text-xs">
          Dados da API: {users.length} registros • Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}