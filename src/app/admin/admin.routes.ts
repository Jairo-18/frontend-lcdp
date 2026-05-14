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
      { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/'         },
    ],
  },
];
