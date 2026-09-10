import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then((m) => m.Login) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/products/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sales/sale/sale').then((m) => m.Sale),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./features/history/stock-operation-history').then((m) => m.StockOperationHistory),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadComponent: () => import('./features/invoices/invoice-list/invoice-list').then((m) => m.InvoiceList),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
