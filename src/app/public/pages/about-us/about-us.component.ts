import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';

interface SocialEntry {
  key: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
  url: string;
  label: string;
  handle: string;
}

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
})
export class AboutUsComponent implements OnInit {
  private readonly _organizationalService: OrganizationalService = inject(
    OrganizationalService,
  );

  readonly org = signal<Organizational | null>(null);

  ngOnInit(): void {
    this._organizationalService.bootstrap().subscribe({
      next: ({ org }) => this.org.set(org),
    });
  }

  get whatsappHref(): string {
    const num = (this.org()?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }

  get socialNetworks(): SocialEntry[] {
    const o = this.org();
    if (!o) return [];
    const candidates: { key: SocialEntry['key']; url: string | undefined; label: string }[] = [
      { key: 'instagram', url: o.instagramUrl, label: 'Instagram' },
      { key: 'facebook',  url: o.facebookUrl,  label: 'Facebook'  },
      { key: 'tiktok',    url: o.tiktokUrl,    label: 'TikTok'    },
      { key: 'youtube',   url: o.youtubeUrl,   label: 'YouTube'   },
    ];
    return candidates
      .filter((c): c is { key: SocialEntry['key']; url: string; label: string } => !!c.url)
      .map((c) => ({ ...c, handle: this._extractHandle(c.url) }));
  }

  private _extractHandle(url: string): string {
    try {
      const path = new URL(url).pathname.replace(/\/$/, '');
      const parts = path.split('/').filter(Boolean);
      return parts[parts.length - 1] ?? '';
    } catch {
      return '';
    }
  }
}
