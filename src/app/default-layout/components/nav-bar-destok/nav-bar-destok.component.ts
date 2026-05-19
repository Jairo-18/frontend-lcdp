import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  @Input() cartCount = 0;
  @Input() logoUrl = '';
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
