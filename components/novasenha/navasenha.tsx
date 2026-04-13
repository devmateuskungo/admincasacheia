"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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


// ✅ Schema correto
const resetPasswordSchema = z
    .object({
        senha: z.string().min(6, {
            message: "A senha deve ter pelo menos 6 caracteres.",
        }),
        confirmarSenha: z.string().min(6),
    })
    .refine((data) => data.senha === data.confirmarSenha, {
        message: "As senhas não coincidem.",
        path: ["confirmarSenha"],
    })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function NovaSenha() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            senha: "",
            confirmarSenha: "",
        },
        mode: "onChange",
    })

    const onSubmit = async (data: ResetPasswordValues) => {
        setIsLoading(true)

        try {
            const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: data.senha,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Erro ao redefinir a senha.")
            }

            toast.success("Senha redefinida com sucesso!", {
                description: "Agora você pode acessar sua conta com a nova senha.",
            })

            router.push("/auth/login")
        } catch (error) {
            toast.error("Erro ao redefinir senha", {
                descriptionClassName: "text-green-700",
                description:
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro inesperado.",


                style: {
                    color: "#FF6467",

                },
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader className="text-center">
                        <CardTitle>Criar nova senha</CardTitle>
                        <CardDescription>
                            Defina uma nova senha para recuperar o acesso à sua conta.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="senha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nova senha</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Digite a nova senha"
                                            disabled={isLoading}
                                            {...field}
                                        />
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
                                        <Input
                                            type="password"
                                            placeholder="Confirme a nova senha"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>

                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-[#ED5379] hover:bg-[#f11f54] mt-10"
                            disabled={isLoading || !form.formState.isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
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
