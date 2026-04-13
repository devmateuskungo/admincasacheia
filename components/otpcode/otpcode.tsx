"use client"
import { Button } from "@/components/ui/button"
import * as React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp"
import Image from "next/image"

export function OtpCode() {
    const [value, setValue] = React.useState("")
    return (
        <Card className="w-full max-w-sm ">
            <div className="flex flex-col items-center justify-center space-x-2 mt-4">
                <Image src="/logo.png" alt="Logo" width={100} height={100} />
                <h1 className="text-2xl">Verificação de segurança</h1>
                <CardDescription className=" text-gray-500 text-center">
                    Digite o código recebido para continuar a recuperação da senha.
                </CardDescription>
            </div>
            <form >
                <CardContent>
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <InputOTP
                            maxLength={6}
                            value={value}
                            onChange={(value) => setValue(value)}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                        <div className="text-center text-sm text-zinc-600">
                            {value === "" ? (
                                <>Digite o código de 6 dígitos que recebeu por SMS.</>
                            ) : (
                                <>Código digitado: <span className="font-medium">{value}</span></>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full bg-[#ED5379] hover:bg-[#f11f54]">
                        Confirmar código
                    </Button>
                    <p className="text-xs text-zinc-500 text-center">
                        Não partilhe este código com ninguém. Ele é válido por alguns minutos.
                    </p>
                </CardFooter>
            </form>
        </Card>

    )
}
