import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  count?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  @Input() userName = 'Admin';
  @Input() userRole = 'Administrador';
  @Input() userInitials = 'AD';
  @Output() exitAdmin = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '▤',  route: '/admin/dashboard' },
    { label: 'Productos',  icon: '🪣', route: '/admin/productos' },
    { label: 'Categorías', icon: '📂', route: '/admin/categorias' },
    { label: 'Marcas',     icon: '🏷️', route: '/admin/marcas' },
    { label: 'Videos',     icon: '▶',  route: '/admin/videos' },
  ];
}
