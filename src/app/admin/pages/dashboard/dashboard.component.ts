import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly _sections = [
    {
      label: 'Catálogo',
      items: [
        {
          path: '/admin/products',
          create: '/admin/products/create-or-edit-products',
          icon: 'inventory_2',
          label: 'Productos',
          description: 'Gestiona el catálogo completo de productos, precios y presentaciones.',
          color: 'bg-blue-50 text-blue-600',
        },
        {
          path: '/admin/brands',
          create: '/admin/brands/create-or-edit-brands',
          icon: 'label',
          label: 'Marcas',
          description: 'Administra las marcas asociadas a los productos.',
          color: 'bg-purple-50 text-purple-600',
        },
        {
          path: '/admin/categories',
          create: '/admin/categories/create-or-edit-categories',
          icon: 'category',
          label: 'Categorías',
          description: 'Organiza los productos en categorías para facilitar la búsqueda.',
          color: 'bg-orange-50 text-orange-600',
        },
        {
          path: '/admin/colors',
          create: '/admin/colors/create-or-edit-colors',
          icon: 'palette',
          label: 'Colores',
          description: 'Gestiona la paleta de colores disponibles para los productos.',
          color: 'bg-pink-50 text-pink-600',
        },
        {
          path: '/admin/units',
          create: '/admin/units/create-or-edit-units',
          icon: 'straighten',
          label: 'Unidades',
          description: 'Define las unidades de medida usadas en las presentaciones.',
          color: 'bg-teal-50 text-teal-600',
        },
      ],
    },
    {
      label: 'Contenido',
      items: [
        {
          path: '/admin/videos',
          create: '/admin/videos/create-or-edit-videos',
          icon: 'smart_display',
          label: 'Videos',
          description: 'Publica videos de YouTube, TikTok e Instagram en la tienda.',
          color: 'bg-red-50 text-red-600',
        },
        {
          path: '/admin/certifications',
          create: '/admin/certifications/create-or-edit-certifications',
          icon: 'verified',
          label: 'Certificaciones',
          description: 'Gestiona las normas ISO y certificados que aparecen en la página de Garantía.',
          color: 'bg-emerald-50 text-emerald-600',
        },
      ],
    },
    {
      label: 'Configuración',
      items: [
        {
          path: '/admin/tax-types',
          create: null,
          icon: 'receipt_long',
          label: 'Impuestos',
          description: 'Configura los tipos de impuesto aplicables a los productos.',
          color: 'bg-yellow-50 text-yellow-600',
        },
        {
          path: '/admin/aplication',
          create: null,
          icon: 'app_settings_alt',
          label: 'Aplicación',
          description: 'Personaliza la imagen, SEO y datos de contacto de la tienda.',
          color: 'bg-green-50 text-green-600',
        },
      ],
    },
  ];
}
