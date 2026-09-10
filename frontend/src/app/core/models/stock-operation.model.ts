export type OperationType = 'REGISTRATION' | 'SALE' | 'ADJUSTMENT';

export interface StockOperation {
  id: number;
  operationType: OperationType;
  productId: number;
  productName: string;
  quantityChange: number;
  operationDate: string;
  comment: string | null;
  performedByUserId: number;
  performedByUsername: string;
}

export interface AdjustmentRequest {
  productId: number;
  newQuantity: number;
  comment?: string;
  userId: number;
}
