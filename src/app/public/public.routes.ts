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
    ],
  },
];
