import Image from "next/image";

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center ">
            <Image src="/404.png" alt="404 Not Found" className="mb-10" width={300} height={300} />
            <h1 className="text-4xl font-bold mb-4">404 - Página Não Encontrada</h1>
            <p className="text-lg text-gray-600">Desculpe, a página que você está procurando não existe.</p>
            <button className="mt-4 px-4 py-2 bg-[#ED5379] text-white rounded hover:bg-[#f11f54]">Voltar para a página inicial</button>
        </div>
    );
}