"use client"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  CheckCircle,
  XCircle,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  User,
  Key,
  UserCog,
  Eye,
  Lock,
  Unlock,
  Save,
  X,
  Mail,
  Briefcase,
  Calendar,

} from "lucide-react"
import { useState } from "react"

// Tipos para os usuários administradores
type UsuarioAdmin = {
  id: string
  nome: string
  email: string
  cargo: string
  telefone: string
  departamento: string
  status: "Ativo" | "Inativo" | "Bloqueado" | "Pendente"
  nivelAcesso: number
  perfil: "Super Admin" | "Administrador" | "Moderador" | "Suporte"
  ultimoLogin: string
  dataCadastro: string
  dataNascimento?: string
  permissoes: string[]
  observacoes?: string
}

// Dados fictícios de usuários administradores
const usuariosAdminData: UsuarioAdmin[] = [
  {
    id: "ADM001",
    nome: "Admin Master",
    email: "admin.master@sistema.com",
    telefone: "(11) 99999-9999",
    cargo: "Super Administrador",
    departamento: "TI",
    status: "Ativo",
    nivelAcesso: 10,
    perfil: "Super Admin",
    ultimoLogin: "Hoje, 09:30",
    dataCadastro: "15/01/2023",
    dataNascimento: "15/05/1985",
    permissoes: ["Todas as permissões", "Gestão de usuários", "Configurações do sistema"],
    observacoes: "Acesso total ao sistema"
  },
  {
    id: "ADM002",
    nome: "Maria Silva",
    email: "maria.silva@sistema.com",
    telefone: "(11) 98888-8888",
    cargo: "Gerente de Sistema",
    departamento: "TI",
    status: "Ativo",
    nivelAcesso: 8,
    perfil: "Administrador",
    ultimoLogin: "Hoje, 08:15",
    dataCadastro: "20/02/2023",
    dataNascimento: "20/08/1990",
    permissoes: ["Gestão de usuários", "Relatórios", "Configurações básicas"],
    observacoes: "Responsável pela equipe de suporte"
  },
  {
    id: "ADM003",
    nome: "Carlos Santos",
    email: "carlos.santos@sistema.com",
    telefone: "(11) 97777-7777",
    cargo: "Administrador de TI",
    departamento: "Tecnologia",
    status: "Inativo",
    nivelAcesso: 9,
    perfil: "Administrador",
    ultimoLogin: "Ontem, 16:45",
    dataCadastro: "05/03/2023",
    dataNascimento: "05/12/1988",
    permissoes: ["Infraestrutura", "Backup", "Segurança"],
    observacoes: "Em férias até 30/02/2024"
  },
  {
    id: "ADM004",
    nome: "Ana Oliveira",
    email: "ana.oliveira@sistema.com",
    telefone: "(11) 96666-6666",
    cargo: "Administrador Financeiro",
    departamento: "Financeiro",
    status: "Ativo",
    nivelAcesso: 7,
    perfil: "Administrador",
    ultimoLogin: "Hoje, 10:20",
    dataCadastro: "12/04/2023",
    dataNascimento: "12/07/1992",
    permissoes: ["Financeiro", "Relatórios", "Faturamento"],
    observacoes: "Acesso restrito ao módulo financeiro"
  },
]

// Função para obter a cor do badge baseado no status
const getStatusColor = (status: string) => {
  switch (status) {
    case "Ativo":
      return "bg-green-100 text-green-800 border-green-200"
    case "Inativo":
      return "bg-gray-100 text-gray-800 border-gray-200"
    case "Bloqueado":
      return "bg-red-100 text-red-800 border-red-200"
    case "Pendente":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Função para obter ícone baseado no status
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Ativo":
      return <CheckCircle className="h-3 w-3 mr-1" />
    case "Inativo":
      return <XCircle className="h-3 w-3 mr-1" />
    case "Bloqueado":
      return <Lock className="h-3 w-3 mr-1" />
    case "Pendente":
      return <UserCog className="h-3 w-3 mr-1" />
    default:
      return null
  }
}

// Função para obter cor do nível de acesso
const getAccessLevelColor = (nivel: number) => {
  if (nivel === 10) return "bg-purple-100 text-purple-800 border-purple-200"
  if (nivel >= 8) return "bg-blue-100 text-blue-800 border-blue-200"
  if (nivel >= 6) return "bg-green-100 text-green-800 border-green-200"
  return "bg-gray-100 text-gray-800 border-gray-200"
}

export function TblUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>(usuariosAdminData)
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<UsuarioAdmin | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdmin | null>(null)
  const [formData, setFormData] = useState<Partial<UsuarioAdmin>>({})

  // Função para abrir modal de edição
  const abrirModalEdicao = (usuario: UsuarioAdmin) => {
    setUsuarioEditando(usuario)
    setFormData({ ...usuario }) // Preenche o formulário com os dados do usuário
    setModalAberto(true)
  }

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false)
    setUsuarioEditando(null)
    setFormData({})
  }

  // Função para salvar edição
  const salvarEdicao = () => {
    if (usuarioEditando && formData) {
      setUsuarios(usuarios.map(usuario => 
        usuario.id === usuarioEditando.id 
          ? { ...usuario, ...formData } as UsuarioAdmin
          : usuario
      ))
      console.log("Usuário atualizado:", formData)
      fecharModal()
    }
  }

  // Função para alterar status do usuário
  const handleAlterarStatus = (usuarioId: string, novoStatus: UsuarioAdmin["status"]) => {
    setUsuarios(usuarios.map(usuario => 
      usuario.id === usuarioId 
        ? { ...usuario, status: novoStatus }
        : usuario
    ))
  }

  // Função para atualizar campo do formulário
  const atualizarCampo = <K extends keyof UsuarioAdmin>(campo: K, valor: UsuarioAdmin[K]) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const totalUsuarios = usuarios.length
  const usuariosAtivos = usuarios.filter(user => user.status === "Ativo").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Usuários Administradores
          </h2>
          <p className="text-gray-500">Gerencie os usuários com acesso administrativo ao sistema</p>
        </div>
        <Button className="bg-[#ED5379] hover:bg-[#ee4b74] mb-4 cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          Novo Administrador
        </Button>
      </div>

      <Table>
        <TableCaption>
          Lista de usuários com permissões administrativas - Total: {totalUsuarios} administradores ({usuariosAtivos} ativos)
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nível Acesso</TableHead>
            <TableHead>Último Login</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{usuario.id}</TableCell>
              <TableCell className="font-medium">{usuario.nome}</TableCell>
              <TableCell className="text-blue-600">{usuario.email}</TableCell>
              <TableCell>{usuario.cargo}</TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(usuario.status)} flex items-center gap-1 w-fit`}>
                  {getStatusIcon(usuario.status)}
                  {usuario.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${getAccessLevelColor(usuario.nivelAcesso)} font-mono`}>
                  <Key className="h-3 w-3 mr-1" />
                  Nível {usuario.nivelAcesso}
                </Badge>
              </TableCell>
              <TableCell>{usuario.ultimoLogin}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* Botão Editar */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => abrirModalEdicao(usuario)}
                    title="Editar usuário"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Dropdown Menu com mais opções */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações para {usuario.nome}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => abrirModalEdicao(usuario)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleAlterarStatus(usuario.id, 
                          usuario.status === "Ativo" ? "Bloqueado" : "Ativo")}
                      >
                        {usuario.status === "Ativo" ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Bloquear Acesso
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Ativar Acesso
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Usuário
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja eliminar o usuário <strong>{usuario.nome}</strong>?
                              Esta ação não pode ser desfeita. O usuário perderá todos os acessos administrativos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
                                setUsuarioParaEliminar(usuario);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Usuário
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Resumo de Administradores</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="bg-green-50">
                {usuariosAtivos} Ativos
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="bg-gray-50">
                {usuarios.filter(u => u.status !== "Ativo").length} Inativos/Bloqueados
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUsuarios(usuariosAdminData)}
              >
                Restaurar Dados
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Modal de Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Usuário Administrador
            </DialogTitle>
            <DialogDescription>
              Editando informações de: <strong>{usuarioEditando?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          {usuarioEditando && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Coluna 1: Informações Básicas */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome || ""}
                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => atualizarCampo("email", e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ""}
                    onChange={(e) => atualizarCampo("telefone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Cargo
                  </Label>
                  <Input
                    id="cargo"
                    value={formData.cargo || ""}
                    onChange={(e) => atualizarCampo("cargo", e.target.value)}
                    placeholder="Digite o cargo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento || ""}
                    onChange={(e) => atualizarCampo("departamento", e.target.value)}
                    placeholder="Digite o departamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento || ""}
                    onChange={(e) => atualizarCampo("dataNascimento", e.target.value)}
                  />
                </div>
              </div>

              {/* Coluna 2: Configurações de Acesso */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "Ativo"}
                    onValueChange={(value) => atualizarCampo("status", value as UsuarioAdmin["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivelAcesso">Nível de Acesso (1-10)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="nivelAcesso"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.nivelAcesso || 1}
                      onChange={(e) => atualizarCampo("nivelAcesso", parseInt(e.target.value))}
                      className="w-20"
                    />
                    <div className="text-sm text-gray-500">
                      <Badge className={getAccessLevelColor(formData.nivelAcesso || 1)}>
                        Nível {formData.nivelAcesso}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil de Acesso</Label>
                  <Select
                    value={formData.perfil || "Administrador"}
                    onValueChange={(value) => atualizarCampo("perfil", value as UsuarioAdmin["perfil"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Moderador">Moderador</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permissões</Label>
                  <div className="space-y-2 p-3 border rounded-md">
                    {(formData.permissoes || []).map((permissao, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{permissao}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const novasPermissoes = (formData.permissoes || []).filter((_, i) => i !== index)
                            atualizarCampo("permissoes", novasPermissoes)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Input
                      placeholder="Adicionar nova permissão"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          atualizarCampo("permissoes", [...(formData.permissoes || []), e.currentTarget.value])
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes || ""}
                    onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                    placeholder="Observações sobre o usuário..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    checked={formData.status === "Ativo"} 
                    onCheckedChange={(checked) => 
                      atualizarCampo("status", checked ? "Ativo" : "Inativo")
                    }
                  />
                  <Label htmlFor="ativo">Usuário Ativo</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              ID: <Badge variant="outline">{usuarioEditando?.id}</Badge>
              <span className="ml-4">
                Cadastrado em: {usuarioEditando?.dataCadastro}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fecharModal}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de eliminação */}
      <AlertDialog open={!!usuarioParaEliminar} onOpenChange={() => setUsuarioParaEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuário Eliminado</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{usuarioParaEliminar?.nome}</strong> foi eliminado com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setUsuarioParaEliminar(null)}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}