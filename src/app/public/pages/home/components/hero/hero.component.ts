import { Component, OnDestroy, PLATFORM_ID, computed, effect, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { ImageVariant, VideoVariant } from '@shared/interfaces/image-variant.interface';
import { resolveVariant, resolveVideoVariant } from '@shared/utilities/image-url.utils';

interface Stat { value: string; label: string }

const HERO_COLORS = [
  '#e23e57','#1a56db','#1e7e34','#f97316','#7c3aed',
  '#0891b2','#ec4899','#ca8a04','#dc2626','#2563eb',
  '#16a34a','#d97706','#9333ea','#0369a1','#be185d',
] as const;

function colorizeText(
  text: string,
  palette: readonly string[],
  startIdx = 0,
): Array<{ char: string; color: string }> {
  let idx = startIdx;
  return [...text].map((char) => {
    if (char === ' ') return { char, color: '' };
    const color = palette[idx % palette.length];
    idx++;
    return { char, color };
  });
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './hero.component.html',
})
export class HeroComponent implements OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  readonly _isBrowser = isPlatformBrowser(this._platformId);

  readonly org          = input<Organizational | null>(null);
  readonly whatsappHref = input<string>('#');
  readonly stats        = input<Stat[]>([]);

  // ── Video slider ─────────────────────────────────────────────────────────
  readonly _videoIndex   = signal(0);
  readonly _heroVideos   = computed(() => (this.org()?.heroVideos ?? []).map(resolveVideoVariant));
  readonly _hasVideos    = computed(() => this._heroVideos().length > 0);
  readonly _currentVideo = computed<VideoVariant | null>(() => {
    const list = this._heroVideos();
    return list.length ? list[this._videoIndex()] : null;
  });

  // ── Image slider ─────────────────────────────────────────────────────────
  readonly _imageIndex   = signal(0);
  readonly _heroImages   = computed(() => (this.org()?.heroImages ?? []).map(resolveVariant));
  readonly _hasImages    = computed(() => this._heroImages().length > 0);
  readonly _currentImage = computed<ImageVariant | null>(() => {
    const list = this._heroImages();
    return list.length ? list[this._imageIndex()] : null;
  });

  // ── Hero text ──────────────────────────────────────────────────────────────
  readonly _heroColors = computed<readonly string[]>(() => {
    const custom = this.org()?.heroColors;
    return custom && custom.length > 0 ? custom : HERO_COLORS;
  });
  readonly _line1Chars = computed(() => {
    const text = this.org()?.heroLine1 ?? 'Tu obra empieza con el';
    return colorizeText(text, this._heroColors(), 0);
  });
  readonly _line2Chars = computed(() => {
    const text1 = this.org()?.heroLine1 ?? 'Tu obra empieza con el';
    const text2 = this.org()?.heroLine2 ?? 'color correcto.';
    const offset = [...text1].filter(c => c !== ' ').length;
    return colorizeText(text2, this._heroColors(), offset);
  });

  constructor() {
    if (this._isBrowser) {
      effect((onCleanup) => {
        const count = this._heroImages().length;
        if (count <= 1) return;
        const timer = setInterval(() => {
          this._imageIndex.update(i => (i + 1) % this._heroImages().length);
        }, 5000);
        onCleanup(() => clearInterval(timer));
      });
    }
  }

  ngOnDestroy(): void {}

  // ── Video handlers ────────────────────────────────────────────────────────
  onVideoCanPlay(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.muted = true;
    video.play().catch(() => {});
  }

  onVideoEnded(event: Event): void {
    const count = this._heroVideos().length;
    if (count <= 1) {
      const video = event.target as HTMLVideoElement;
      video.currentTime = 0;
      video.play().catch(() => {});
      return;
    }
    this._videoIndex.update((i) => (i + 1) % count);
  }

  goToVideo(index: number): void { this._videoIndex.set(index); }
  goToImage(index: number): void { this._imageIndex.set(index); }
}
