import { OrdersProductsList, } from "@/components/card-pedidos/cardpedidos";


export default function Pedidos() {
    return (

        <div>


            <h2 className="text-2xl font-bold mt-2">Pedidos</h2>
            <p className="mb-3">Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque provident officia non inventore quae consequatur laudantium sint <br /> impedit error vel, architecto ducimus qui odio rem ex voluptatem et tempore a.</p>
            <OrdersProductsList />


        </div>

        // Para dashboard - versão simplificada
    )

}