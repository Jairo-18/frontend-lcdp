import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface CategoryPill {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-catalog-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './catalog-navbar.component.html',
  styleUrls: ['./catalog-navbar.component.scss'],
})
export class CatalogNavbarComponent {
  @Input() cartCount = 0;
  @Input() categories: CategoryPill[] = [];
  @Input() activeCategory: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() openCart = new EventEmitter<void>();
  @Output() selectCategory = new EventEmitter<string | null>();
  @Output() goHome = new EventEmitter<void>();
  @Output() goAdmin = new EventEmitter<void>();

  searchQuery = '';

  onSearch(): void {
    this.searchChange.emit(this.searchQuery);
  }
}
