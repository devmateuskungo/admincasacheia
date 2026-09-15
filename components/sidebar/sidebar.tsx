"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronsUpDown,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/api";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: "notifications";
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", url: "/dashbord/home", icon: LayoutDashboard },
      { title: "Pedidos", url: "/dashbord/pedidos", icon: ShoppingCart },
      { title: "Notificações", url: "/dashbord/notificacoes", icon: Bell, badge: "notifications" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/dashbord/product", icon: Package },
      { title: "Categorias", url: "/dashbord/categorias", icon: Tags },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Fornecedores", url: "/dashbord/fornecedores", icon: Truck },
      { title: "Clientes", url: "/dashbord/clientes", icon: Users },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Usuários", url: "/dashbord/usuarios", icon: UserCog },
      { title: "Configurações", url: "/dashbord/configuracoes", icon: Settings },
    ],
  },
];

function useActiveUrl(): (url: string) => boolean {
  const pathname = usePathname();
  return (url: string) => pathname === url || pathname.startsWith(`${url}/`);
}

interface LocalUser {
  name?: string;
  role?: string;
}

function userInitials(name?: string): string {
  const source = (name?.trim() || "U").split(/\s+/);
  const first = source[0]?.[0] ?? "U";
  const last = source.length > 1 ? source[source.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function SidebarUserCard() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const { state } = useSidebar();

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

  return (
    <SidebarMenuButton
      asChild
      size="lg"
      tooltip="Configurações"
      className="h-14 grow-0 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
    >
      <Link href="/dashbord/configuracoes">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ED5379] to-[#f11f54] text-xs font-bold text-white">
          {userInitials(user?.name)}
        </span>
        <span className="grid flex-1 text-left leading-tight">
          <span className="truncate text-sm font-semibold text-gray-800">
            {user?.name?.trim() || "Usuário"}
          </span>
          <span className="truncate text-xs capitalize text-gray-400">
            {user?.role?.replace(/_/g, " ") || "Administrador"}
          </span>
        </span>
        <ChevronsUpDown className={cn("size-4", state === "collapsed" && "hidden")} />
      </Link>
    </SidebarMenuButton>
  );
}

function SidebarNotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      try {
        const res = await fetch(`${BASE_URL}/profile/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          data?: { read?: boolean }[];
        };
        const list = Array.isArray(data?.data) ? data.data : [];
        setCount(list.filter((n) => !n.read).length);
      } catch {
        /* ignore */
      }
    };

    void load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <SidebarMenuBadge
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED5379] px-1.5 text-[11px] font-semibold text-white",
        count === 0 && "hidden"
      )}
    >
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}

export function AppSidebar() {
  const isActive = useActiveUrl();

  return (
    <Sidebar
      collapsible="icon"
      className="
        m-2
        rounded-2xl
        border
        shadow-sm
        overflow-hidden
        h-[calc(100vh-1rem)]
        bg-white
      "
    >
      <SidebarContent className="gap-0">
        {/* Marca */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="h-16 rounded-xl text-gray-900 hover:bg-transparent"
              >
                <Link href="/dashbord/home">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ED5379] to-[#f11f54] text-white shadow-md shadow-[#ED5379]/30">
                    <Store className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-base font-bold">Casa Cheia</span>
                    <span className="truncate text-xs font-medium text-gray-400">
                      Administração
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Navegação por grupos */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="h-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className={cn(
                            "group/menu-button h-10 rounded-lg px-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-[#ED5379]/10 text-[#ED5379] hover:bg-[#ED5379]/15 hover:text-[#ED5379] data-[active=true]:bg-[#ED5379]/10"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon
                              className="size-5 shrink-0"
                              strokeWidth={active ? 2.4 : 2}
                            />
                            <span>{item.title}</span>
                            {item.badge === "notifications" && <SidebarNotificationBadge />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>

      {/* Rodapé com utilizador */}
      <SidebarFooter className="border-t border-gray-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUserCard />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}