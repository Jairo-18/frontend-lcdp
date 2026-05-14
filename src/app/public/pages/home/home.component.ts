import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';

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

  readonly stats: Stat[] = [
    { value: '+1.200', label: 'Productos' },
    { value: '8',      label: 'Marcas'    },
    { value: '20+',    label: 'Años'      },
  ];

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }): void => this._org.set(org),
    });
  }

  get whatsappHref(): string {
    const num: string = (this._org()?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }
}
