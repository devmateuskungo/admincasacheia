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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BASE_URL } from "@/lib/api"
import Image from "next/image"

// Schema de validação com Zod
const signupSchema = z.object({
    nome: z.string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome muito longo")
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras")
        .transform(name => name.trim()),

    telefone: z.string()
        .min(9, "Telefone deve ter pelo menos 9 dígitos")
        .max(15, "Telefone muito longo")
        .regex(/^9\d{2}\s\d{3}\s\d{3}$/, "Formato inválido. Use 923 456 789")
        .transform(phone => {
            const numbers = phone.replace(/\D/g, '')
            return numbers.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
        }),

    senha: z.string()
        .min(6, "Senha deve ter pelo menos 6 caracteres")
        .max(50, "Senha muito longa")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
        }),

    confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"]
})

// Tipo inferido do schema
type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Inicializar react-hook-form com Zod
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            nome: "",
            telefone: "",
            senha: "",
            confirmarSenha: ""
        },
        mode: "onChange" // Validação enquanto digita
    })

    // Função para formatar telefone enquanto digita
    const formatPhoneInput = (value: string) => {
        const numbers = value.replace(/\D/g, '')

        if (numbers.length === 0) return ""
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
        return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`
    }

    // Função de submit
    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true)

        try {
            // Aqui você faria a chamada à API para criar a conta
            console.log("Dados validados para cadastro:", data)

            // Exemplo de chamada à API
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.nome,
                    telefone: data.telefone.replace(/\s/g, ''),
                    password: data.senha,
                    role: "admin"
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erro ao criar conta')
            }

            const result = await response.json()

            // Sucesso - redirecionar ou mostrar mensagem
            toast.success("Conta criada com sucesso!", {
                description: "Você será redirecionado para a página de login.",
            })
            router.push('/auth/login')

            // Limpar formulário
            form.reset()

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente."
            toast.error("Erro ao criar conta", {
                description: errorMessage,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm">
            <div className="flex flex-col items-center justify-center space-x-2 mt-4 mb-6">
                <Image src="/logo.png" alt="Logo" width={100} height={100} />
                <h1 className="text-2xl">Criar Conta</h1>
            </div>
            <CardHeader>
                <CardTitle>Criar uma conta</CardTitle>
                <CardDescription>
                    Preencha seus dados para criar uma nova conta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Campo Nome */}
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome completo *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Seu nome completo"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Campo Telefone */}
                        <FormField
                            control={form.control}
                            name="telefone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="923 456 789"
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatPhoneInput(e.target.value)
                                                field.onChange(formatted)
                                            }}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Campo Senha */}
                        <FormField
                            control={form.control}
                            name="senha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Campo Confirmar Senha */}
                        <FormField
                            control={form.control}
                            name="confirmarSenha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Senha *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Digite a senha novamente"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Botão de Submit */}
                        <Button
                            type="submit"
                            className="w-full cursor-pointer bg-[#ED5379] hover:bg-[#f11f54]"
                            disabled={isLoading || !form.formState.isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando conta...
                                </>
                            ) : (
                                "Criar Conta"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <p className="text-sm text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                </p>
                <div className="text-sm text-center">
                    Já tem uma conta?{" "}
                    <Link
                        href="/auth/login"
                        className="text-[#ED5379] hover:text-[#f11f54] underline"
                    >
                        Faça login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}