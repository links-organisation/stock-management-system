import { Sale } from './sale.model';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    saleId: string;
    totalAmount: number;
    sale: Sale | null;
}
