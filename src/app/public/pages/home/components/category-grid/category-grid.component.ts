import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Category } from '@shared/interfaces/category.interface';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './category-grid.component.html',
})
export class CategoryGridComponent {
  readonly categories = input<Category[]>([]);
}
