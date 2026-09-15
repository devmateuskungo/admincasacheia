"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Phone, Lock } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Image from "next/image";

const loginSchema = z.object({
  telefone: z.string().min(9, { message: "O telefone deve ter pelo menos 9 dígitos." }),
  senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { telefone: "", senha: "" },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: data.telefone, password: data.senha }),
      });

      const dataResponse = await response.json();

      if (!response.ok) {
        throw new Error(dataResponse.message || "Falha no login. Verifique suas credenciais.");
      }

      localStorage.setItem("token", dataResponse.token);
      localStorage.setItem("user", JSON.stringify(dataResponse.user));

      toast.success("Login realizado com sucesso!", {
        description: "Você será redirecionado para o painel.",
      });

      router.push("/dashbord/home");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro no Login", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-0 p-0 shadow-none md:shadow-md md:border">
      <CardHeader className="items-center pb-2">
        <div className="mb-2 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Casa Cheia" width={64} height={64} className="h-16 w-16 object-contain" />
        </div>
        <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Entre com o seu telefone e senha para aceder ao painel.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-5">
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
                        disabled={isLoading}
                        {...field}
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
                  <div className="flex items-center">
                    <FormLabel>Senha</FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto text-sm text-[#ED5379] underline-offset-4 hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder="********"
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
          </CardContent>

          <CardFooter className="flex-col gap-3 px-6 pb-6 pt-5">
            <Button
              type="submit"
              className="w-full bg-[#ED5379] hover:bg-[#f11f54]"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <p className="text-sm text-muted-foreground">ou</p>
            <Link
              href="/auth/singup"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Criar uma conta
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}