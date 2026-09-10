export interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  customerName: string | null;
  performedByUserId: number;
  performedByUsername: string;
  items: SaleItem[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
}

export interface SaleRequest {
  userId: number;
  customerName?: string;
  items: SaleItemRequest[];
}
