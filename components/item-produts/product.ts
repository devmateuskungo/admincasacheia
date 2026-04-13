export interface Product {
  sku: string;
  status: string;
  id: string;
  name: string;
  price: number; // em Kz
  categoryId: string;
  categoryName?: string; // Opcional - pode ser buscado do backend
  stock: number;
  description: string;
  images: string[]; // URLs das imagens
}

export interface Category {
  id: string;
  name: string;
}