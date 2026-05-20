import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'about-us',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent,
          ),
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./pages/catalogo/catalogo.component').then(
            (m) => m.CatalogoComponent,
          ),
      },
      {
        path: 'producto/:id',
        loadComponent: () =>
          import('./pages/producto/producto.component').then(
            (m) => m.ProductoComponent,
          ),
      },
    ],
  },
];
