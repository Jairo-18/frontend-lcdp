import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'aplication',
        loadComponent: () =>
          import('./pages/aplication/aplication.component').then((m) => m.AplicationComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./pages/brands/brands.component').then((m) => m.BrandsComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'units',
        loadComponent: () =>
          import('./pages/units/units.component').then((m) => m.UnitsComponent),
      },
      { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/'         },
    ],
  },
];
