"use client"
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  CalendarDays,
  MessageCircle,
  RefreshCw,
  Search,
  Smartphone,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  telefone: string;
  role: string;
  createdAt: string;
}

const USER_TINTS = [
  'bg-blue-50 text-blue-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-violet-50 text-violet-600',
  'bg-rose-50 text-rose-600',
  'bg-cyan-50 text-cyan-600',
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return USER_TINTS[hash % USER_TINTS.length];
}

function initialFor(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

function formatDate(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isCurrentMonth(value: string | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
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

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 9) {
      return `https://wa.me/244${cleaned}`;
    }

    return `https://wa.me/${cleaned}`;
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return 'Não informado';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 9) {
      return `+244 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }

    return phone;
  };

  const withWhatsApp = users.filter((u) => u.telefone).length;
  const withoutPhone = Math.max(0, users.length - withWhatsApp);
  const newThisMonth = users.filter((u) => isCurrentMonth(u.createdAt)).length;

  const statCards = [
    {
      label: 'Total de clientes',
      value: users.length,
      icon: Users,
      tint: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Com WhatsApp',
      value: withWhatsApp,
      icon: Smartphone,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Sem telefone',
      value: withoutPhone,
      icon: UserRound,
      tint: 'bg-gray-100 text-gray-600',
    },
    {
      label: 'Novos este mês',
      value: newThisMonth,
      icon: CalendarDays,
      tint: 'bg-amber-50 text-amber-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="mt-2 h-6 w-8" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-9 w-full rounded-lg sm:max-w-xs" />
          <div className="flex items-center gap-3 lg:justify-end">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Erro ao carregar clientes</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          {error.includes("Sessão expirada") && (
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ir para login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.tint)}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED5379]/30 focus:border-[#ED5379]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="text-sm text-gray-500">
            {filteredUsers.length} de {users.length} cliente{users.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            title="Atualizar lista"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-14 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">
            {searchTerm ? 'Nenhum resultado para a pesquisa' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {searchTerm
              ? 'Tente ajustar os termos da pesquisa.'
              : 'Quando os clientes se registarem, aparecerão aqui.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ED5379] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#f11f54]"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar pesquisa
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm w-full min-w-0">
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 sm:px-6 min-w-0">
                    Nome do cliente
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 sm:px-6 whitespace-nowrap">
                    Telefone
                  </TableHead>
                  <TableHead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 sm:px-6 hidden lg:table-cell whitespace-nowrap">
                    Registado em
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 sm:px-6 w-36">
                    WhatsApp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 px-4 sm:px-6 min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                            tintFor(user.name)
                          )}
                        >
                          {initialFor(user.name)}
                        </span>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 truncate block" title={user.name}>
                            {user.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {user.role === 'user' ? 'Cliente' : user.role}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-700">
                        {formatPhoneDisplay(user.telefone)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-4 sm:px-6 hidden lg:table-cell whitespace-nowrap text-gray-500 text-sm">
                      {formatDate(user.createdAt) || '—'}
                    </TableCell>
                    <TableCell className="py-4 px-4 sm:px-6 text-right whitespace-nowrap w-36">
                      {user.telefone ? (
                        <a
                          href={formatWhatsAppLink(user.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow"
                          title={`Conversar com ${user.name} no WhatsApp`}
                        >
                          <MessageCircle size={18} />
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
        </div>
      )}
    </div>
  );
}