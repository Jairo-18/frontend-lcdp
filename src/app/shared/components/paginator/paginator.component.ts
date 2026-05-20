import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  host: { class: 'flex flex-col items-center gap-3' },
  templateUrl: './paginator.component.html',
})
export class PaginatorComponent {
  @Input({ required: true }) page!: number;
  @Input({ required: true }) pageCount!: number;
  @Input() summary = '';
  @Output() pageChange = new EventEmitter<number>();

  get pageNumbers(): (number | null)[] {
    const total = this.pageCount;
    const current = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    if (current > 3) pages.push(null);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++)
      pages.push(p);
    if (current < total - 2) pages.push(null);
    pages.push(total);
    return pages;
  }

  emit(page: number): void {
    if (page < 1 || page > this.pageCount || page === this.page) return;
    this.pageChange.emit(page);
  }
}
