import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen font-sans overflow-hidden bg-white">
      {/* Lado esquerdo - Formulário */}
      
      <div className="flex w-full md:w-1/2 items-center justify-center  px-6">
        {children}
      </div>

      {/* Lado direito - Imagem e Boas-vindas */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-6">
        <div className="w-full h-full bg-[url('/bg-img.png')] bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="p-8 text-white max-w-md rounded-xl">
            <h1 className="text-4xl font-bold mb-4">Bem-vindo 👋</h1>
            <p className="text-lg leading-relaxed">
              Acesse sua conta ou crie uma nova para gerenciar suas vendas de forma simples e eficiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
