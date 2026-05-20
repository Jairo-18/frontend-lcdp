import {
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { Category } from '@shared/interfaces/category.interface';
import { Brand } from '@shared/interfaces/brand.interface';
import { HeroComponent } from './components/hero/hero.component';
import { WhatsappBannerComponent } from './components/whatsapp-banner/whatsapp-banner.component';
import { CategoryGridComponent } from './components/category-grid/category-grid.component';
// import { BrandGridComponent } from './components/brand-grid/brand-grid.component';
import { NewProductsComponent } from './components/new-products/new-products.component';

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    WhatsappBannerComponent,
    CategoryGridComponent,
    // BrandGridComponent,
    NewProductsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly _orgService = inject(OrganizationalService);

  readonly _org: WritableSignal<Organizational | null> = signal(null);
  readonly _categories: WritableSignal<Category[]> = signal([]);
  readonly _brands: WritableSignal<Brand[]> = signal([]);

  readonly stats: Stat[] = [
    { value: '+1000', label: 'Productos' },
    { value: '30+', label: 'Marcas' },
    { value: '3+', label: 'Años' },
  ];

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org, categories, brands }) => {
        this._org.set(org);
        this._categories.set(categories);
        this._brands.set(brands);
      },
    });
  }

  get whatsappHref(): string {
    const num = (this._org()?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }
}
