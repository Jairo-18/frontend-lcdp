import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoService } from '@shared/services/video.service';
import { Video } from '@shared/interfaces/video.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type Platform = 'all' | 'youtube' | 'tiktok' | 'instagram';

interface Tab {
  id: Platform;
  label: string;
  icon: string;
}

const PER_PAGE = 12;

const TABS: Tab[] = [
  { id: 'all',       label: 'Todos',     icon: 'play_circle'   },
  { id: 'youtube',   label: 'YouTube',   icon: 'smart_display' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'music_video'   },
  { id: 'instagram', label: 'Instagram', icon: 'camera_roll'   },
];

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './videos.component.html',
})
export class VideosComponent implements OnInit, OnDestroy {
  private readonly _videoService: VideoService = inject(VideoService);
  private readonly _sanitizer: DomSanitizer = inject(DomSanitizer);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading   = signal(false);
  readonly _allVideos = signal<Video[]>([]);
  readonly _activeTab = signal<Platform>('all');
  readonly _page      = signal(1);

  readonly _filtered = computed(() => {
    const tab = this._activeTab();
    const all = this._allVideos();
    if (tab === 'all') return all;
    return all.filter((v) => this._platform(v.url) === tab);
  });

  readonly _pageCount = computed(() =>
    Math.ceil(this._filtered().length / PER_PAGE),
  );

  readonly _paged = computed(() => {
    const p = this._page();
    return this._filtered().slice((p - 1) * PER_PAGE, p * PER_PAGE);
  });

  readonly _from = computed(() =>
    this._filtered().length === 0 ? 0 : (this._page() - 1) * PER_PAGE + 1,
  );
  readonly _to = computed(() =>
    Math.min(this._page() * PER_PAGE, this._filtered().length),
  );

  readonly tabs = computed(() =>
    TABS.filter((t) => {
      if (t.id === 'all') return true;
      return this._allVideos().some((v) => this._platform(v.url) === t.id);
    }).map((t) => ({
      ...t,
      count:
        t.id === 'all'
          ? this._allVideos().length
          : this._allVideos().filter((v) => this._platform(v.url) === t.id)
              .length,
    })),
  );

  ngOnInit(): void {
    this._loading.set(true);
    this._videoService
      .getPublic({ page: 1, perPage: 500 })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (res) => {
          this._allVideos.set(res.data);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  selectTab(tab: Platform): void {
    this._activeTab.set(tab);
    this._page.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this._pageCount() || page === this._page()) return;
    this._page.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private _platform(url: string): Platform {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
    if (/tiktok\.com/i.test(url)) return 'tiktok';
    if (/instagram\.com/i.test(url)) return 'instagram';
    return 'all';
  }

  platformLabel(url: string): string {
    const p = this._platform(url);
    return TABS.find((t) => t.id === p)?.label ?? 'Video';
  }

  platformIcon(url: string): string {
    const p = this._platform(url);
    return TABS.find((t) => t.id === p)?.icon ?? 'play_circle';
  }

  embedUrl(video: Video): SafeResourceUrl | null {
    const url = video.url;

    // YouTube
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    if (ytMatch)
      return this._sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      );

    // TikTok
    const ttMatch = url.match(/\/video\/(\d+)/);
    if (ttMatch)
      return this._sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      );

    // Instagram — construye /embed/ desde la URL limpia
    if (/instagram\.com/i.test(url)) {
      const clean = url.split('?')[0].replace(/\/$/, '');
      return this._sanitizer.bypassSecurityTrustResourceUrl(
        `${clean}/embed/`,
      );
    }

    return null;
  }

  isEmbed(video: Video): boolean {
    return this.embedUrl(video) !== null;
  }

  isVertical(url: string): boolean {
    if (/tiktok\.com/i.test(url)) return true;
    if (/instagram\.com\/reel\//i.test(url)) return true;
    if (/youtube\.com\/shorts\//i.test(url)) return true;
    return false;
  }
}
