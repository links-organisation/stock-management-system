export interface Product {
  id: number;
  name: string;
  reference: string;
  categoryId: number | null;
  categoryName: string | null;
  purchasePrice: number;
  sellingPrice: number;
  quantityInStock: number;
  alertThreshold: number;
  lowStock: boolean;
}

export interface ProductRequest {
  name: string;
  reference: string;
  categoryId?: number | null;
  purchasePrice: number;
  sellingPrice: number;
  quantityInStock: number;
  alertThreshold: number;
  userId: number;
}
