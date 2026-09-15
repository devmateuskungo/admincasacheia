"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import Link from "next/link"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Eye, EyeOff, Loader2, Lock, Phone, User } from "lucide-react"
import { toast } from "sonner"
import { BASE_URL } from "@/lib/api"
import Image from "next/image"

const signupSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras")
    .transform((name) => name.trim()),

  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .max(15, "Telefone muito longo")
    .regex(/^9\d{2}\s\d{3}\s\d{3}$/, "Formato inválido. Use 923 456 789")
    .transform((phone) => {
      const numbers = phone.replace(/\D/g, "")
      return numbers.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")
    }),

  senha: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(50, "Senha muito longa")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
    }),

  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { nome: "", telefone: "", senha: "", confirmarSenha: "" },
    mode: "onChange",
  })

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, "")

    if (numbers.length === 0) return ""
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`
  }

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.nome,
          telefone: data.telefone.replace(/\s/g, ""),
          password: data.senha,
          role: "admin",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erro ao criar conta")
      }

      toast.success("Conta criada com sucesso!", {
        description: "Você será redirecionado para a página de login.",
      })
      router.push("/auth/login")

      form.reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente."
      toast.error("Erro ao criar conta", { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 p-0 shadow-none md:shadow-md md:border">
      <CardHeader className="items-center pb-2 text-center md:items-start md:text-left">
        <div className="mb-2 flex flex-col items-center gap-3 md:items-start">
          <Image src="/logo.png" alt="Casa Cheia" width={64} height={64} className="h-16 w-16 object-contain" />
        </div>
        <CardTitle className="text-xl">Criar uma conta</CardTitle>
        <CardDescription>
          Preencha os seus dados para começar a gerir a sua loja.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input placeholder="Seu nome completo" className="pl-9" disabled={isLoading} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="923 456 789"
                        className="pl-9"
                        {...field}
                        onChange={(e) => field.onChange(formatPhoneInput(e.target.value))}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-9 pr-9"
                        {...field}
                        disabled={isLoading}
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
                  <FormLabel>Confirmar Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        className="pl-9 pr-9"
                        {...field}
                        disabled={isLoading}
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

            <Button
              type="submit"
              className="w-full bg-[#ED5379] hover:bg-[#f11f54]"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta…
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col items-center gap-3 px-6 pb-6 pt-4">
        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com os nossos Termos de Uso e Política de Privacidade.
        </p>
        <div className="text-sm text-center">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-[#ED5379] hover:text-[#f11f54] underline">
            Faça login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}