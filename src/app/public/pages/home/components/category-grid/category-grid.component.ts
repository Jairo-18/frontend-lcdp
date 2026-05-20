import { Component, ElementRef, ViewChild, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Category } from '@shared/interfaces/category.interface';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './category-grid.component.html',
})
export class CategoryGridComponent {
  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLElement>;
  readonly categories = input<Category[]>([]);

  scroll(dir: 1 | -1): void {
    this.scrollEl.nativeElement.scrollBy({ left: dir * 360, behavior: 'smooth' });
  }
}
