"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { BASE_URL } from "@/lib/api"

const resetPasswordSchema = z
  .object({
    senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmarSenha: z.string().min(6, { message: "Confirme a nova senha." }),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function NovaSenha() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { senha: "", confirmarSenha: "" },
    mode: "onChange",
  })

  const onSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true)
    try {
      if (!BASE_URL) throw new Error("BASE_URL não definida no .env")

      const telefone =
        new URLSearchParams(window.location.search).get("telefone")?.trim() ||
        sessionStorage.getItem("recoveryPhone")?.trim() ||
        ""
      const code =
        new URLSearchParams(window.location.search).get("code")?.trim() ||
        sessionStorage.getItem("recoveryCode")?.trim() ||
        ""

      if (!telefone || !code) {
        throw new Error("Faltam dados da recuperação. Volte ao início e tente novamente.")
      }

      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: data.senha,
          telefone,
          code,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message =
          errorData.message || (response.status === 429 ? "Muitas tentativas inválidas. Tente mais tarde." : "")
        throw new Error(message || "Erro ao redefinir a senha.")
      }

      sessionStorage.removeItem("recoveryPhone")
      sessionStorage.removeItem("recoveryCode")
      toast.success("Senha redefinida com sucesso!", {
        description: "Agora você pode acessar a sua conta com a nova senha.",
      })
      router.push("/auth/login")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado."
      toast.error("Erro ao redefinir senha", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 p-0 shadow-none md:shadow-md md:border">
      <CardHeader className="items-center pb-2 text-center md:items-start md:text-left">
        <Image src="/logo.png" alt="Casa Cheia" width={64} height={64} className="mb-2 h-16 w-16 object-contain" />
        <CardTitle className="text-xl">Criar nova senha</CardTitle>
        <CardDescription>
          Defina uma nova senha para recuperar o acesso à sua conta.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-5">
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder="Digite a nova senha"
                        className="pl-9 pr-9"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirme a nova senha"
                        className="pl-9 pr-9"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-5">
            <Button
              type="submit"
              className="w-full bg-[#ED5379] hover:bg-[#f11f54]"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar…
                </>
              ) : (
                "Redefinir senha"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}