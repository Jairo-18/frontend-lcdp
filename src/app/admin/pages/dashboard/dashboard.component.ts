import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly _nav = [
    { path: '/admin/products',   icon: 'inventory_2',      label: 'Productos'  },
    { path: '/admin/brands',     icon: 'label',            label: 'Marcas'     },
    { path: '/admin/categories', icon: 'category',         label: 'Categorías' },
    { path: '/admin/units',      icon: 'straighten',       label: 'Unidades'   },
    { path: '/admin/aplication', icon: 'app_settings_alt', label: 'Aplicación' },
  ];
}
