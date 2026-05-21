import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
})
export class AboutUsComponent implements OnInit {
  private readonly _orgService = inject(OrganizationalService);

  readonly org = signal<Organizational | null>(null);

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }) => this.org.set(org),
    });
  }

  get whatsappHref(): string {
    const num = (this.org()?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }
}
