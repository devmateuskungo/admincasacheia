import { NotificationsList } from "@/components/notificacoes/notifications";

export default function Notificacoes() {
  return (
    <div>
      <h2 className="text-2xl font-bold mt-2">Notificações</h2>
      <p className="mb-3 text-gray-500">
        Acompanhe as notificações de novos pedidos, alterações de status, pagamentos e
        outras atividades relevantes da sua loja.
      </p>
      <NotificationsList />
    </div>
  );
}