import ItemCliente from '@/components/item-list-user-clientes/itemclientes';

export default function Cliente() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-gray-500">
          Consulte e contacte os clientes registados na sua loja.
        </p>
      </header>
      <ItemCliente />
    </div>
  );
}