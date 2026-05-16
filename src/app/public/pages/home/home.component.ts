import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { Category } from '@shared/interfaces/category.interface';
import { environment } from '@env/environment';
import { HeroComponent } from './components/hero/hero.component';
import { WhatsappBannerComponent } from './components/whatsapp-banner/whatsapp-banner.component';
import { CategoryGridComponent } from './components/category-grid/category-grid.component';
import { NewProductsComponent } from './components/new-products/new-products.component';

interface Stat { value: string; label: string }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, WhatsappBannerComponent, CategoryGridComponent, NewProductsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);

  readonly _org: WritableSignal<Organizational | null> = signal(null);
  readonly _categories: WritableSignal<Category[]> = signal([]);
  readonly apiUrl = environment.apiUrl;

  readonly stats: Stat[] = [
    { value: '+1000', label: 'Productos' },
    { value: '30+', label: 'Marcas' },
    { value: '3+', label: 'Años' },
  ];

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org, categories }): void => {
        this._org.set(org);
        this._categories.set(categories);
      },
    });
  }

  get whatsappHref(): string {
    const num: string = (this._org()?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }
}
