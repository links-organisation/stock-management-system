export type OperationType = 'REGISTRATION' | 'SALE' | 'ADJUSTMENT';

export interface StockOperation {
    id: string;
    operationType: OperationType;
    productId: string;
    productName: string;
    quantityChange: number;
    operationDate: string;
    comment: string | null;
    performedByUserId: string;
    performedByUsername: string;
    performedByFullname: string;
}

export interface AdjustmentRequest {
    productId: string;
    newQuantity: number;
    comment?: string;
    userId: string;
}
