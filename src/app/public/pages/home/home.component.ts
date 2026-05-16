import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { Category } from '@shared/interfaces/category.interface';
import { environment } from '@env/environment';

interface Stat { value: string; label: string }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);

  readonly _org: WritableSignal<Organizational | null> = signal(null);
  readonly _categories: WritableSignal<Category[]> = signal([]);
  readonly apiUrl = environment.apiUrl;

  readonly stats: Stat[] = [
    { value: '+1.200', label: 'Productos' },
    { value: '8',      label: 'Marcas'    },
    { value: '20+',    label: 'Años'      },
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
