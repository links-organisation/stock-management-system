import { Sale } from './sale.model';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  saleId: number;
  totalAmount: number;
  sale: Sale | null;
}
