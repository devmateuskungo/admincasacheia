import Image from "next/image";

const FEATURES = [
  {
    title: "Gestão de pedidos",
    description: "Acompanhe e confirme encomendas em tempo real.",
  },
  {
    title: "Catálogo em destaque",
    description: "Controle produtos, stock e categorias num só lugar.",
  },
  {
    title: "Relatórios do dia-a-dia",
    description: "Acompanhe vendas e receitas com estatísticas claras.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen font-sans bg-white">
      {/* Lado esquerdo - Formulário */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center px-6 py-10">
        <div className="absolute left-6 top-6 flex items-center gap-2">
          <Image src="/logo.png" alt="Casa Cheia" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="text-lg font-bold text-gray-900">Casa Cheia Admin</span>
        </div>
        {children}
      </div>

      {/* Lado direito - Imagem e Boas-vindas */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-6">
        <div className="relative w-full h-full overflow-hidden rounded-2xl">
          <img
            src="/bg-img.png"
            alt="Loja Casa Cheia"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-[#ED5379]/40" />
          <div className="relative z-10 flex h-full flex-col justify-center p-10 lg:p-14 text-white">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Painel da loja
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight lg:text-5xl">
                Bem-vindo 👋
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/85">
                Acesse sua conta ou crie uma nova para gerenciar suas vendas de
                forma simples e eficiente.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="h-4 w-4"
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-sm text-white/70">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}