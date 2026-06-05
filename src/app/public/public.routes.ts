import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { reuseKey: 'public-home' },
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'sobre-nosotros',
        data: { reuseKey: 'public-sobre-nosotros' },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent,
          ),
      },
      {
        path: 'catalogo',
        data: { reuseKey: 'public-catalogo' },
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
      {
        path: 'videos',
        data: { reuseKey: 'public-videos' },
        loadComponent: () =>
          import('./pages/videos/videos.component').then(
            (m) => m.VideosComponent,
          ),
      },
      {
        path: 'ayuda/como-pedir',
        data: { reuseKey: 'public-como-pedir' },
        loadComponent: () =>
          import('./pages/como-pedir/como-pedir.component').then(
            (m) => m.ComoPedirComponent,
          ),
      },
      {
        path: 'ayuda/garantia',
        data: { reuseKey: 'public-garantia' },
        loadComponent: () =>
          import('./pages/garantia/garantia.component').then(
            (m) => m.GarantiaComponent,
          ),
      },
      {
        path: 'asesor',
        data: { reuseKey: 'public-asesor' },
        loadComponent: () =>
          import('./pages/asesor/asesor.component').then(
            (m) => m.AsesorComponent,
          ),
      },
    ],
  },
];
