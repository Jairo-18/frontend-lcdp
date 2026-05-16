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
          import('./pages/aplication/create-or-edit-aplication/create-or-edit-aplication.component').then(
            (m) => m.CreateOrEditAplicationComponent,
          ),
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            data: { reuse: true },
            loadComponent: () =>
              import('./pages/products/products.component').then((m) => m.ProductsComponent),
          },
          {
            path: 'create-or-edit-products',
            loadComponent: () =>
              import('./pages/products/create-or-edit-products/create-or-edit-products.component').then(
                (m) => m.CreateOrEditProductsComponent,
              ),
          },
          {
            path: 'create-or-edit-products/:id',
            loadComponent: () =>
              import('./pages/products/create-or-edit-products/create-or-edit-products.component').then(
                (m) => m.CreateOrEditProductsComponent,
              ),
          },
        ],
      },
      {
        path: 'brands',
        children: [
          {
            path: '',
            data: { reuse: true },
            loadComponent: () =>
              import('./pages/brands/brands.component').then((m) => m.BrandsComponent),
          },
          {
            path: 'create-or-edit-brands',
            loadComponent: () =>
              import('./pages/brands/create-or-edit-brands/create-or-edit-brands.component').then(
                (m) => m.CreateOrEditBrandsComponent,
              ),
          },
          {
            path: 'create-or-edit-brands/:id',
            loadComponent: () =>
              import('./pages/brands/create-or-edit-brands/create-or-edit-brands.component').then(
                (m) => m.CreateOrEditBrandsComponent,
              ),
          },
        ],
      },
      {
        path: 'categories',
        children: [
          {
            path: '',
            data: { reuse: true },
            loadComponent: () =>
              import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
          },
          {
            path: 'create-or-edit-categories',
            loadComponent: () =>
              import('./pages/categories/create-or-edit-categories/create-or-edit-categories.component').then(
                (m) => m.CreateOrEditCategoriesComponent,
              ),
          },
          {
            path: 'create-or-edit-categories/:id',
            loadComponent: () =>
              import('./pages/categories/create-or-edit-categories/create-or-edit-categories.component').then(
                (m) => m.CreateOrEditCategoriesComponent,
              ),
          },
        ],
      },
      {
        path: 'units',
        children: [
          {
            path: '',
            data: { reuse: true },
            loadComponent: () =>
              import('./pages/units/units.component').then((m) => m.UnitsComponent),
          },
          {
            path: 'create-or-edit-units',
            loadComponent: () =>
              import('./pages/units/create-or-edit-units/create-or-edit-units.component').then(
                (m) => m.CreateOrEditUnitsComponent,
              ),
          },
          {
            path: 'create-or-edit-units/:id',
            loadComponent: () =>
              import('./pages/units/create-or-edit-units/create-or-edit-units.component').then(
                (m) => m.CreateOrEditUnitsComponent,
              ),
          },
        ],
      },
      {
        path: 'tax-types',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/tax-types/tax-types.component').then((m) => m.TaxTypesComponent),
      },
      { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/'         },
    ],
  },
];
