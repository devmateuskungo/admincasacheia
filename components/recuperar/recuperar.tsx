"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Phone } from "lucide-react"
import Link from "next/link"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { BASE_URL } from "@/lib/api"

const forgotSchema = z.object({
  telefone: z
    .string()
    .min(9, "O telefone deve ter pelo menos 9 dígitos.")
    .regex(/^9\d{2}\s?\d{3}\s?\d{3}$/, "Formato inválido. Use 923 456 789"),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length === 0) return ""
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
  return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`
}

export function RecuperarSenha() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { telefone: "" },
    mode: "onChange",
  })

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true)
    try {
      if (!BASE_URL) throw new Error("BASE_URL não definida no .env")

      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: data.telefone.replace(/\s/g, "") }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Não foi possível enviar o código.")
      }

      toast.success("Código enviado!", {
        description: "Verifique o SMS no seu telefone para continuar.",
      })
      const phone = data.telefone.replace(/\s/g, "")
      sessionStorage.setItem("recoveryPhone", phone)
      router.push(`/auth/otp?telefone=${encodeURIComponent(phone)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado."
      toast.error("Erro ao enviar código", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 p-0 shadow-none md:shadow-md md:border">
      <CardHeader className="items-center pb-2 text-center md:items-start md:text-left">
        <Image src="/logo.png" alt="Casa Cheia" width={64} height={64} className="mb-2 h-16 w-16 object-contain" />
        <CardTitle className="text-xl">Recuperar a sua senha</CardTitle>
        <CardDescription>
          Informe o seu número angolano para receber um código e redefinir a senha.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="923 456 789"
                        className="pl-9"
                        inputMode="numeric"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-gray-500">
              Você receberá um código por SMS com alguns minutos de validade.
            </p>
            <Button
              type="submit"
              className="w-full bg-[#ED5379] hover:bg-[#f11f54]"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A enviar…
                </>
              ) : (
                "Enviar código"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  )
}