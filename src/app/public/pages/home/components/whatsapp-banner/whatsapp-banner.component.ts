import { Component, OnDestroy, PLATFORM_ID, computed, effect, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { resolveVariant } from '@shared/utilities/image-url.utils';

@Component({
  selector: 'app-whatsapp-banner',
  standalone: true,
  templateUrl: './whatsapp-banner.component.html',
})
export class WhatsappBannerComponent implements OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  readonly _isBrowser = isPlatformBrowser(this._platformId);

  readonly whatsappHref = input<string>('#');
  readonly org          = input<Organizational | null>(null);

  readonly _imageIndex    = signal(0);
  readonly _bannerImages  = computed<ImageVariant[]>(() =>
    (this.org()?.bannerImages ?? []).map(resolveVariant)
  );
  readonly _hasImages     = computed(() => this._bannerImages().length > 0);
  readonly _currentImage  = computed<ImageVariant | null>(() => {
    const list = this._bannerImages();
    return list.length ? list[this._imageIndex()] : null;
  });

  constructor() {
    if (this._isBrowser) {
      effect((onCleanup) => {
        const count = this._bannerImages().length;
        if (count <= 1) return;
        const timer = setInterval(() => {
          this._imageIndex.update(i => (i + 1) % this._bannerImages().length);
        }, 5000);
        onCleanup(() => clearInterval(timer));
      });
    }
  }

  ngOnDestroy(): void {}

  goToImage(index: number): void { this._imageIndex.set(index); }
}
