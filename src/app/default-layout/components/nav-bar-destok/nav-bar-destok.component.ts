import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryPill } from '@shared/interfaces/category.interface';

@Component({
  selector: 'app-nav-bar-destok',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './nav-bar-destok.component.html',
  styleUrl: './nav-bar-destok.component.scss',
})
export class NavBarDestokComponent {
  private readonly _router: Router = inject(Router);

  @Input() cartCount: number = 0;
  @Input() logoUrl: string = '';
  @Input() categories: CategoryPill[] = [];
  @Input() activeCategory: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() openCart = new EventEmitter<void>();
  @Output() selectCategory = new EventEmitter<string | null>();
  @Output() goHome = new EventEmitter<void>();
  @Output() goAdmin = new EventEmitter<void>();

  searchQuery: string = '';

  onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }

  goSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this._router.navigate(['/catalogo'], { queryParams: { q } });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.goSearch();
  }
}
