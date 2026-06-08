import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectFieldComponent } from '@shared/components';
import { SelectOption } from '@shared/interfaces/forms.interface';
import { Product, ProductPresentation } from '@shared/interfaces/product.interface';
import { ProductService } from '@shared/services/product.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [FormsModule, RouterLink, SelectFieldComponent],
  templateUrl: './calculadora.component.html',
})
export class CalculadoraComponent implements OnInit {
  private readonly _productService = inject(ProductService);
  private readonly _orgService = inject(OrganizationalService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly whatsappNumber = signal<string | null>(null);

  readonly selectedProductId = signal<number | null>(null);
  readonly selectedPresentationId = signal<number | null>(null);
  readonly area = signal<number | null>(null);

  readonly productOptions = computed<SelectOption[]>(() =>
    this.products().map((p) => ({
      value: p.id,
      label: p.brand ? `${p.name} — ${p.brand.name}` : p.name,
    })),
  );

  readonly selectedProduct = computed(() => {
    const id = this.selectedProductId();
    return id ? this.products().find((p) => p.id === id) ?? null : null;
  });

  readonly presentations = computed(() => {
    const product = this.selectedProduct();
    if (!product) return [];
    return product.presentations.filter((p) => p.rendimiento && p.rendimiento > 0);
  });

  readonly presentationOptions = computed<SelectOption[]>(() =>
    this.presentations().map((p) => ({
      value: p.id,
      label: `${this.presLabel(p)} — ${p.rendimiento} m²/unidad`,
    })),
  );

  readonly selectedPresentation = computed(() => {
    const id = this.selectedPresentationId();
    return id ? this.presentations().find((p) => p.id === id) ?? null : null;
  });

  readonly resultado = computed(() => {
    const pres = this.selectedPresentation();
    const areaVal = this.area();
    if (!pres?.rendimiento || !areaVal || areaVal <= 0) return null;
    const units = areaVal / pres.rendimiento;
    return Math.ceil(units * 10) / 10;
  });

  readonly productImage = computed(() => {
    const product = this.selectedProduct();
    if (!product?.presentations?.length) return null;
    const pres = product.presentations[0];
    if (!pres.images?.length) return null;
    return pres.images[0].variants.md;
  });

  readonly whatsappUrl = computed(() => {
    const num = this.whatsappNumber();
    if (!num) return null;
    return `https://wa.me/${num.replace(/\D/g, '')}`;
  });

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe((data) => {
      this.whatsappNumber.set(data.org?.whatsappNumber ?? null);
    });

    this._productService.getCalculadora().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onProductChange(value: string | number): void {
    const productId = Number(value);
    this.selectedProductId.set(productId);
    this.selectedPresentationId.set(null);
    this.area.set(null);
    const pres = this.products()
      .find((p) => p.id === productId)
      ?.presentations.filter((p) => p.rendimiento && p.rendimiento > 0);
    if (pres?.length === 1) {
      this.selectedPresentationId.set(pres[0].id);
    }
  }

  onPresentationChange(value: string | number): void {
    this.selectedPresentationId.set(Number(value));
    this.area.set(null);
  }

  onAreaChange(value: number): void {
    this.area.set(value);
  }

  reset(): void {
    this.selectedProductId.set(null);
    this.selectedPresentationId.set(null);
    this.area.set(null);
  }

  presLabel(pres: ProductPresentation): string {
    return pres.unitOfMeasure?.name ?? `Presentación #${pres.id}`;
  }

  formatPrice(value: number | null | undefined): string {
    if (value == null) return '';
    return '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value));
  }
}
