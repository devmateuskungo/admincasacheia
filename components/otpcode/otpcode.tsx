"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp"
import { BASE_URL } from "@/lib/api"

export function OtpCode() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value.length !== 6) return

    const telefone =
      new URLSearchParams(window.location.search).get("telefone")?.trim() ||
      sessionStorage.getItem("recoveryPhone")?.trim() ||
      ""

    if (!telefone) {
      toast.error("Número de telefone não encontrado", {
        description: "Volte ao passo anterior e tente novamente.",
      })
      return
    }

    setIsLoading(true)
    try {
      if (!BASE_URL) throw new Error("BASE_URL não definida no .env")

      const response = await fetch(`${BASE_URL}/api/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, code: value }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Código inválido ou expirado.")
      }

      toast.success("Código verificado!", {
        description: "Agora defina a sua nova senha.",
      })
      sessionStorage.setItem("recoveryCode", value)
      router.push(
        `/auth/new-password?telefone=${encodeURIComponent(telefone)}&code=${encodeURIComponent(value)}`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado."
      toast.error("Código inválido", { description: message })
      setValue("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 p-0 shadow-none md:shadow-md md:border">
      <CardHeader className="items-center pb-2 text-center">
        <Image src="/logo.png" alt="Casa Cheia" width={64} height={64} className="mb-2 h-16 w-16 object-contain" />
        <CardTitle className="text-xl">Verificação de segurança</CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos que recebeu por SMS para continuar.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <InputOTP maxLength={6} value={value} onChange={setValue} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-center text-xs text-gray-500">
              Não partilhe este código com ninguém. Ele é válido por alguns minutos.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 px-6 pb-6 pt-5">
          <Button
            type="submit"
            className="w-full bg-[#ED5379] hover:bg-[#f11f54]"
            disabled={isLoading || value.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A verificar…
              </>
            ) : (
              "Confirmar código"
            )}
          </Button>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}