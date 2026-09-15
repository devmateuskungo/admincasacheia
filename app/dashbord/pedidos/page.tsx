import { OrdersProductsList } from "@/components/card-pedidos/cardpedidos";

export default function Pedidos() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-gray-500">
          Gerencie todos os pedidos da loja: acompanhe o estado de cada um, altere o status e consulte os detalhes dos produtos.
        </p>
      </header>
      <OrdersProductsList />
    </div>
  );
}