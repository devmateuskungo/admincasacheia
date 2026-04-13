import ItemCliente from "@/components/item-list-user-clientes/itemclientes";

export default function Cliente(){
    return(
        <>

        <main>
            <section className="container">
                <h1 className="text-2xl font-bold py-3">Clientes</h1>


                <ItemCliente/>
            </section>
        </main>
        </>
    )
}