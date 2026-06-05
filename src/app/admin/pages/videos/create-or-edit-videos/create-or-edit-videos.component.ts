import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InputFieldComponent } from '@shared/components';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { VideoService } from '@shared/services/video.service';
import { Video, VideoDto } from '@shared/interfaces/video.interface';
import { CacheRouteReuseStrategy } from '@shared/strategies/cache-route-reuse.strategy';

interface OEmbedResponse {
  title?: string;
}

@Component({
  selector: 'app-create-or-edit-videos',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: './create-or-edit-videos.component.html',
})
export class CreateOrEditVideosComponent implements OnInit, OnDestroy {
  private readonly _videoService: VideoService = inject(VideoService);
  private readonly _routeReuse: CacheRouteReuseStrategy = inject(CacheRouteReuseStrategy);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading        = signal(false);
  readonly _saving         = signal(false);
  readonly _fetchingTitle  = signal(false);
  readonly _editingId      = signal<string | null>(null);

  readonly form = this._fb.nonNullable.group({
    url:      ['', [Validators.required, Validators.maxLength(500)]],
    title:    ['', [Validators.required, Validators.maxLength(200)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    this._editingId.set(idParam ?? null);

    if (idParam) {
      this._loading.set(true);
      this._videoService
        .getOne(idParam)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (video: Video) => {
            this.form.patchValue({ url: video.url, title: video.title, isActive: video.isActive ?? true });
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        });
    }

    this.form.get('url')!.valueChanges
      .pipe(
        debounceTime(800),
        distinctUntilChanged(),
        filter((url) => !!url),
        takeUntil(this._destroy$),
      )
      .subscribe((raw) => {
        const normalized = this._normalizeUrl(raw);
        if (normalized !== raw) {
          this.form.get('url')!.setValue(normalized, { emitEvent: false });
        }
        this._fetchTitle(normalized);
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _normalizeUrl(raw: string): string {
    const s = raw.trim();

    // TikTok blockquote embed → extraer cite="..."
    const ttCite = s.match(/cite="(https:\/\/www\.tiktok\.com\/[^"]+)"/);
    if (ttCite) return ttCite[1];

    // Instagram blockquote embed → extraer data-instgrm-permalink="..."
    const igPermalink = s.match(/data-instgrm-permalink="([^"?]+)/);
    if (igPermalink) return igPermalink[1];

    // YouTube iframe embed → extraer src y convertir a URL de watch
    const ytSrc = s.match(/src="https?:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/);
    if (ytSrc) return `https://www.youtube.com/watch?v=${ytSrc[1]}`;

    return s;
  }

  private _fetchTitle(url: string): void {
    const oembedUrl = this._oembedUrl(url);
    if (!oembedUrl) return;

    this._fetchingTitle.set(true);
    this._http.get<OEmbedResponse>(oembedUrl).pipe(takeUntil(this._destroy$)).subscribe({
      next: (res) => {
        if (res.title && !this.form.get('title')!.value) {
          this.form.get('title')!.setValue(res.title);
          this.form.get('title')!.markAsDirty();
        }
        this._fetchingTitle.set(false);
      },
      error: () => this._fetchingTitle.set(false),
    });
  }

  private _oembedUrl(url: string): string | null {
    if (/youtube\.com|youtu\.be/i.test(url))
      return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    // TikTok oEmbed bloquea CORS desde dominios externos — título manual
    return null;
  }

  goBack(): void {
    this._router.navigate(['/admin/videos']);
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;

    const rawUrl = this.form.get('url')!.value;
    const cleanUrl = this._normalizeUrl(rawUrl);
    if (cleanUrl !== rawUrl) {
      this.form.get('url')!.setValue(cleanUrl, { emitEvent: false });
    }

    this._saving.set(true);

    const dto: VideoDto = this.form.getRawValue();
    const onSuccess = (): void => {
      this._saving.set(false);
      this.form.markAsPristine();
      this._routeReuse.invalidate('videos');
      this.goBack();
    };
    const onError = (): void => this._saving.set(false);

    const editingId = this._editingId();
    if (editingId) {
      this._videoService.update(editingId, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._videoService.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
