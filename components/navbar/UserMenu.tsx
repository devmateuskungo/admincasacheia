"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PerfilModal } from "@/components/configuracoes/PerfilModal";

interface LocalUser {
  name?: string;
  email?: string;
  telefone?: string;
  role?: string;
}

function userInitials(name?: string, email?: string): string {
  const source = (name?.trim() || email?.trim() || "U").split(/\s+/);
  const first = source[0]?.[0] ?? "U";
  const last = source.length > 1 ? source[source.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function UserMenu() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as LocalUser) : null);
      } catch {
        setUser(null);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const initials = userInitials(user?.name, user?.email);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED5379]"
            aria-label="Menu do usuário"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ED5379] text-sm font-bold text-white">
              {initials}
            </span>
            <span className="hidden sm:block max-w-[10rem] truncate text-sm font-medium">
              {user?.name?.trim() || "Usuário"}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="mt-1 w-56">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-800">
              {user?.name?.trim() || "Usuário"}
            </span>
            {user?.email && (
              <span className="text-xs font-normal text-gray-500 truncate">
                {user.email}
              </span>
            )}
            {user?.role && (
              <span className="text-xs font-normal text-gray-400 capitalize">
                {user.role}
              </span>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setProfileOpen(true)}
            className="cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ED5379]/10 text-[#ED5379]">
              <UserIcon className="h-4 w-4" />
            </span>
            Perfil
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashbord/configuracoes">
              <Settings className="h-4 w-4 text-[#ED5379]" />
              Configurações
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild variant="destructive" className="cursor-pointer">
            <Link href="/auth/logout">
              <LogOut className="h-4 w-4" />
              Terminar sessão
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PerfilModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onSuccess={() => {
          setProfileOpen(false);
          try {
            const raw = localStorage.getItem("user");
            if (raw) setUser(JSON.parse(raw) as LocalUser);
          } catch {
            setUser(null);
          }
        }}
      />
    </div>
  );
}