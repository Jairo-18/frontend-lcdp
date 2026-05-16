import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService } from '@shared/services/product.service';
import { Product } from '@shared/interfaces/product.interface';
import { environment } from '@env/environment';

const CLIPBOARD_PALETTE: readonly string[] = [
  '#1a56db',
  '#d93025',
  '#1e7e34',
  '#7c3aed',
  '#b45309',
];

@Component({
  selector: 'app-new-products',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './new-products.component.html',
})
export class NewProductsComponent implements OnInit {
  private readonly _productService: ProductService = inject(ProductService);

  readonly products: WritableSignal<Product[]> = signal([]);
  readonly loading: WritableSignal<boolean> = signal(true);
  readonly apiUrl: string = environment.apiUrl;
  readonly skeletons: null[] = Array(10).fill(null);

  ngOnInit(): void {
    this._productService
      .getAll({ page: 1, limit: 10, orderBy: 'createdAt', order: 'DESC' })
      .subscribe({
        next: (res): void => {
          this.products.set(res.items);
          this.loading.set(false);
        },
        error: (): void => this.loading.set(false),
      });
  }

  clipboardColor(index: number): string {
    return CLIPBOARD_PALETTE[index % CLIPBOARD_PALETTE.length];
  }

  firstImage(product: Product): string | null {
    return product.presentations?.[0]?.images?.[0]?.url ?? null;
  }

  firstSku(product: Product): string {
    return product.presentations[0]?.sku ?? '—';
  }
}
