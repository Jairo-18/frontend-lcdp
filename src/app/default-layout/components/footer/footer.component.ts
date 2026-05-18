import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Organizational } from '@shared/interfaces/organizational.interface';

interface FooterLink {
  label: string;
  route: string;
}
interface SocialLink {
  label: string;
  key: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'maps' | 'website';
  url: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  @Input() set org(value: Organizational | null) {
    this._org = value;
    this._buildSocial(value);
  }
  get org(): Organizational | null {
    return this._org;
  }

  private _org: Organizational | null = null;

  readonly year: number = new Date().getFullYear();

  socialLinks: SocialLink[] = [];

  readonly tiendaLinks: FooterLink[] = [
    { label: 'Catálogo', route: '/catalogo' },
    { label: 'Marcas', route: '/marcas' },
    { label: 'Videos', route: '/videos' },
  ];

  readonly ayudaLinks: FooterLink[] = [
    { label: 'Cómo pedir', route: '/ayuda/como-pedir' },
    { label: 'Envíos', route: '/ayuda/envios' },
    { label: 'Asesoría', route: '/ayuda/asesoria' },
    { label: 'Garantía', route: '/ayuda/garantia' },
  ];

  get whatsappHref(): string {
    const num: string = (this._org?.whatsappNumber ?? '').replace(/\D/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }

  private _buildSocial(org: Organizational | null): void {
    if (!org) {
      this.socialLinks = [];
      return;
    }
    const candidates: { url: string | undefined; label: string; key: SocialLink['key'] }[] = [
      { url: org.facebookUrl,  label: 'Facebook',  key: 'facebook'  },
      { url: org.instagramUrl, label: 'Instagram', key: 'instagram' },
      { url: org.tiktokUrl,   label: 'TikTok',    key: 'tiktok'    },
      { url: org.youtubeUrl,  label: 'YouTube',   key: 'youtube'   },
      { url: org.mapsUrl,     label: 'Ubicación', key: 'maps'      },
      { url: org.website,     label: 'Sitio web', key: 'website'   },
    ];
    this.socialLinks = candidates
      .filter((c): c is SocialLink & { url: string } => !!c.url)
      .map(({ label, key, url }) => ({ label, key, url }));
  }
}
