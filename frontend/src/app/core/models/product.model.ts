export interface Product {
    id: string;
    name: string;
    reference: string;
    categoryId: string | null;
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
    categoryId?: string | null;
    purchasePrice: number;
    sellingPrice: number;
    quantityInStock: number;
    alertThreshold: number;
    userId: string;
}
