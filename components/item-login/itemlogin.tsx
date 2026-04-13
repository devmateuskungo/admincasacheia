"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"
import Image from "next/image"

// Zod schema for validation
const loginSchema = z.object({
    telefone: z.string().min(9, { message: "O telefone deve ter pelo menos 9 dígitos." }),
    senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            telefone: "",
            senha: "",
        },
        mode: "onChange",
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await apiFetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telefone: data.telefone,
                    password: data.senha,
                }),
            });

            const dataResponse = await response.json();

            if (!response.ok) {
                throw new Error(dataResponse.message || 'Falha no login. Verifique suas credenciais.');
            }

            localStorage.setItem("token", dataResponse.token);
            localStorage.setItem("user", JSON.stringify(dataResponse.user));

            toast.success("Login realizado com sucesso!", {
                description: "Você será redirecionado para o painel.",
            });

            router.push('/dashbord/home');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
            toast.error("Erro no Login", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm">
            <div className="flex flex-col items-center justify-center space-x-2 mt-4 mb-6">
                <Image src="/logo.png" alt="Logo" width={100} height={100} />
                <h1 className="text-2xl">Login</h1>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Acesse sua conta</CardTitle>
                        <CardDescription>
                            Insira seu número e senha para acessar sua conta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="telefone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="923123453"
                                            required
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
                            name="senha"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center">
                                        <FormLabel>Senha</FormLabel>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                        >
                                            Esqueceu sua senha?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            required
                                            placeholder="*******"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex-col m-2 gap-2">
                        <Button
                            type="submit"
                            className="w-full cursor-pointer bg-[#ED5379] hover:bg-[#f11f54]"
                            disabled={isLoading || !form.formState.isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground">ou</p>
                        <Link href="/auth/singup" className={cn(buttonVariants({ variant: "outline" }), " w-full")}>
                            Criar uma conta
                        </Link>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
