import { BarChart, DollarSign, Handshake, Home, Inbox, Package, Settings, Tag, Users, Warehouse } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/dashbord/home", icon: Home, description: "Visão geral das vendas" },
  { title: "Pedidos", url: "/dashbord/pedidos", icon: Inbox, description: "Gerenciar pedidos" },
  { title: "Produtos", url: "/dashbord/product", icon: Package, description: "Catálogo de produtos" },
  { title: "Categorias", url: "/dashbord/categorias", icon: Tag, description: "Categorias dos produtos" },
  { title: "Fornecedores", url: "/dashbord/fornecedores", icon: Handshake, description: "Parceiros e fornecedores" },
  { title: "Clientes", url: "/dashbord/clientes", icon: Users, description: "Gerenciar clientes" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart, description: "Relatórios de vendas" },
  { title: "Estoque", url: "/estoque", icon: Warehouse, description: "Controle de estoque" },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, description: "Fluxo de caixa" },
  { title: "Usuários", url: "/dashbord/usuarios", icon: Settings, description: "Configurações do sistema" },
  { title: "Configurações", url: "/dashbord/configuracoes", icon: Settings, description: "Sessão e localização da empresa" },
];

export function AppSidebar() {
  return (
    <Sidebar
      className="
        m-2
        rounded-2xl
        border
        shadow-sm
        overflow-hidden
        h-[calc(100vh-1rem)]
      "
    >
      <SidebarContent className="p-2 bg-[#ED5379] text-white">
        <SidebarGroup className="rounded-xl ">
          <SidebarGroupLabel className="text-white/80">
            Application
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="hover:bg-white/10"
                  >
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
