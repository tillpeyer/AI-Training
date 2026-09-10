import { Routes } from '@angular/router';

/**
 * Three surfaces, flat, no nesting. A fourth would mean rethinking the
 * information architecture rather than extending it.
 *
 * `/admin` is deliberately NOT guarded. Authorization belongs to the backend
 * (`403 NOT_ADMIN`); the UI must not pretend to gate it.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Menu · Lunch Order',
    loadComponent: () => import('./routes/menu-page/menu-page').then((m) => m.MenuPage),
  },
  {
    path: 'orders',
    title: 'My orders · Lunch Order',
    loadComponent: () =>
      import('./routes/my-orders-page/my-orders-page').then((m) => m.MyOrdersPage),
  },
  {
    path: 'admin',
    title: 'Admin · Lunch Order',
    loadComponent: () => import('./routes/admin-page/admin-page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: '' },
];
