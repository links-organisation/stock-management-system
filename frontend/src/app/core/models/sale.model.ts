export interface SaleItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Sale {
    id: string;
    saleDate: string;
    totalAmount: number;
    customerName: string | null;
    performedByUserId: string;
    performedByUsername: string;
    performedByFullname: string;
    items: SaleItem[];
}

export interface SaleItemRequest {
    productId: string;
    quantity: number;
}

export interface SaleRequest {
    userId: string;
    customerName?: string;
    items: SaleItemRequest[];
}
