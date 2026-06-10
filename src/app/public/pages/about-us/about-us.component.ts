import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrganizationalService } from '@shared/services/organizational.service';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { resolveVariant } from '@shared/utilities/image-url.utils';

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
export class AboutUsComponent implements OnInit, OnDestroy {
  private readonly _organizationalService: OrganizationalService = inject(OrganizationalService);
  private readonly _platformId = inject(PLATFORM_ID);
  readonly _isBrowser = isPlatformBrowser(this._platformId);

  readonly org              = signal<Organizational | null>(null);
  readonly aboutImages      = computed<ImageVariant[]>(() =>
    (this.org()?.aboutImages ?? []).map(resolveVariant)
  );
  readonly _aboutImageIndex = signal(0);
  readonly _currentAboutImage = computed<ImageVariant | null>(() => {
    const list = this.aboutImages();
    return list.length ? list[this._aboutImageIndex()] : null;
  });

  constructor() {
    if (this._isBrowser) {
      effect((onCleanup) => {
        const count = this.aboutImages().length;
        if (count <= 1) return;
        const timer = setInterval(() => {
          this._aboutImageIndex.update(i => (i + 1) % this.aboutImages().length);
        }, 5000);
        onCleanup(() => clearInterval(timer));
      });
    }
  }

  ngOnInit(): void {
    this._organizationalService.bootstrap().subscribe({
      next: ({ org }) => this.org.set(org),
    });
  }

  ngOnDestroy(): void {}

  goToAboutImage(index: number): void { this._aboutImageIndex.set(index); }

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
