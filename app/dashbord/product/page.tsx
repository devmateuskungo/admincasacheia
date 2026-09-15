import { ProductPageClient } from "@/components/product/ProductPageClient";
import { BASE_URL } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images?: string[];
  image?: string[];
  description: string;
  category?: string | { _id: string; name: string };
  partner?: string | { _id: string; name?: string };
}

/** GET /products — backend pode devolver `data` (doc. da API) ou `formatted` (legado). */
interface ProductsListResponse {
  status?: boolean;
  data?: Product[];
  formatted?: Product[];
  pagina_atual?: number;
  total_paginas?: number;
  total_produtos?: number;
}

interface CategoriesResponse {
  status: boolean;
  categories: Array<{ _id: string; name: string }>;
}

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params?.page === "string" ? Number(params.page) : 1;
  const limit = 12;
  let products: Product[] = [];
  let pageInfo = { current: 1, totalPages: 1, totalProducts: 0 };
  let categories: Array<{ _id: string; name: string }> = [];
  let error: string | null = null;

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${BASE_URL}/products?page=${page}&limit=${limit}`, {
        cache: "no-store",
      }),
      fetch(`${BASE_URL}/categories`, { next: { revalidate: 300 } }),
    ]);

    if (!productsRes.ok) throw new Error("Falha ao carregar os produtos");
    const data: ProductsListResponse = await productsRes.json();
    const rawList = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.formatted)
        ? data.formatted
        : [];
    products = rawList;
    pageInfo = {
      current: data.pagina_atual ?? page,
      totalPages: Math.max(1, data.total_paginas ?? 1),
      totalProducts: data.total_produtos ?? rawList.length,
    };

    if (categoriesRes.ok) {
      const catData: CategoriesResponse = await categoriesRes.json();
      categories = catData.categories ?? [];
    }
  } catch (err) {
    error = "Erro ao carregar os produtos. Tente atualizar a página.";
    console.error(err);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Produtos</h1>
        <p className="text-gray-500">
          Gerencie o catálogo da loja: cadastre, edite e acompanhe o stock de cada produto.
        </p>
      </header>

      {error ? (
        <p className="text-center text-red-600 text-xl mt-10">{error}</p>
      ) : (
        <ProductPageClient
          products={products}
          pageInfo={pageInfo}
          categories={categories}
        />
      )}
    </div>
  );
}