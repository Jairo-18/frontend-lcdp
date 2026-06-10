import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputFieldComponent } from '@shared/components';
import { TextareaFieldComponent } from '@shared/components';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrganizationalService } from '@shared/services/organizational.service';
import { UploadService } from '@shared/services/upload.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { ImageEditorService } from '@shared/services/image-editor.service';
import {
  Organizational,
  UpdateOrganizationalDto,
  CreateOrganizationalDto,
} from '@shared/interfaces/organizational.interface';
import { ImageVariant, VideoVariant } from '@shared/interfaces/image-variant.interface';
import { resolveVariant, resolveVideoVariant } from '@shared/utilities/image-url.utils';
import {
  Tab,
  TabItem,
  SocialField,
} from '@shared/interfaces/aplication.interface';

@Component({
  selector: 'app-create-or-edit-aplication',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, TextareaFieldComponent],
  templateUrl: './create-or-edit-aplication.component.html',
})
export class CreateOrEditAplicationComponent implements OnInit, OnDestroy {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _organizationService: OrganizationalService = inject(OrganizationalService);
  private readonly _uploadService: UploadService = inject(UploadService);
  private readonly _editorSvc: ImageEditorService = inject(ImageEditorService);
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  @ViewChild('logoInput')        logoInputRef!:        ElementRef<HTMLInputElement>;
  @ViewChild('faviconInput')     faviconInputRef!:     ElementRef<HTMLInputElement>;
  @ViewChild('heroVideoInput')   heroVideoInputRef!:   ElementRef<HTMLInputElement>;
  @ViewChild('heroImageInput')   heroImageInputRef!:   ElementRef<HTMLInputElement>;
  @ViewChild('bannerImageInput') bannerImageInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('aboutImageInput')  aboutImageInputRef!:  ElementRef<HTMLInputElement>;

  readonly _loading: WritableSignal<boolean>              = signal(false);
  readonly _saving: WritableSignal<boolean>               = signal(false);
  readonly _tab: WritableSignal<Tab>                      = signal('general');
  readonly _uploadingLogo                                 = signal(false);
  readonly _uploadingFavicon                              = signal(false);
  readonly _uploadingHeroVideo                            = signal(false);
  readonly _uploadingHeroImage                            = signal(false);
  readonly _uploadingBannerImage                          = signal(false);
  readonly _uploadingAboutImage                           = signal(false);

  readonly _heroVideos   = signal<VideoVariant[]>([]);
  readonly _heroImages   = signal<ImageVariant[]>([]);
  readonly _bannerImages = signal<ImageVariant[]>([]);
  readonly _aboutImages  = signal<ImageVariant[]>([]);
  readonly _heroColors   = signal<string[]>([]);

  private _orgId: string | null = null;

  readonly tabs: TabItem[] = [
    { id: 'general',   label: 'General',         icon: 'storefront'     },
    { id: 'branding',  label: 'Identidad visual', icon: 'palette'        },
    { id: 'media',     label: 'Media',            icon: 'perm_media'     },
    { id: 'redes',     label: 'Redes sociales',   icon: 'share'          },
    { id: 'contenido', label: 'Contenido',        icon: 'article'        },
    { id: 'seo',       label: 'SEO',              icon: 'travel_explore' },
  ];

  readonly socialFields: SocialField[] = [
    { key: 'facebookUrl',  label: 'Facebook',    icon: 'thumb_up',     placeholder: 'https://facebook.com/...'  },
    { key: 'instagramUrl', label: 'Instagram',   icon: 'photo_camera', placeholder: 'https://instagram.com/...' },
    { key: 'youtubeUrl',   label: 'YouTube',     icon: 'play_circle',  placeholder: 'https://youtube.com/...'   },
    { key: 'tiktokUrl',    label: 'TikTok',      icon: 'music_note',   placeholder: 'https://tiktok.com/@...'   },
    { key: 'mapsUrl',      label: 'Google Maps', icon: 'location_on',  placeholder: 'https://maps.google.com/...' },
  ];

  readonly form = this._formBuilder.nonNullable.group({
    name:               ['', [Validators.required, Validators.maxLength(150)]],
    legalName:          ['', Validators.maxLength(150)],
    nit:                ['', Validators.maxLength(50)],
    email:              ['', [Validators.email, Validators.maxLength(150)]],
    phone:              ['', Validators.maxLength(25)],
    whatsappNumber:     ['', Validators.maxLength(25)],
    website:            ['', Validators.maxLength(200)],
    address:            ['', Validators.maxLength(200)],
    city:               ['', Validators.maxLength(100)],
    department:         ['', Validators.maxLength(100)],
    logoUrl:            ['', Validators.maxLength(500)],
    faviconUrl:         ['', Validators.maxLength(500)],
    primaryColor:       ['', Validators.maxLength(20)],
    secondaryColor:     ['', Validators.maxLength(20)],
    accentColor:        ['', Validators.maxLength(20)],
    bgColor:            ['', Validators.maxLength(20)],
    textColor:          ['', Validators.maxLength(20)],
    facebookUrl:        ['', Validators.maxLength(500)],
    instagramUrl:       ['', Validators.maxLength(500)],
    youtubeUrl:         ['', Validators.maxLength(500)],
    tiktokUrl:          ['', Validators.maxLength(500)],
    mapsUrl:            ['', Validators.maxLength(500)],
    description:        [''],
    heroLine1:          ['', Validators.maxLength(200)],
    heroLine2:          ['', Validators.maxLength(200)],
    aboutTitle:         ['', Validators.maxLength(200)],
    aboutDescription:   [''],
    missionTitle:       ['', Validators.maxLength(200)],
    missionDescription: [''],
    visionTitle:        ['', Validators.maxLength(200)],
    visionDescription:  [''],
    howToOrderVideoUrl: ['', Validators.maxLength(500)],
    metaTitle:          ['', Validators.maxLength(200)],
    metaDescription:    [''],
    metaKeywords:       ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this._loading.set(true);
    this._organizationService.get().subscribe({
      next: (data: Organizational): void => {
        this._orgId = data.id;
        this.form.patchValue(data);
        if (data.heroVideos?.length)   this._heroVideos.set(data.heroVideos.map(resolveVideoVariant));
        if (data.heroImages?.length)   this._heroImages.set(data.heroImages.map(resolveVariant));
        if (data.bannerImages?.length) this._bannerImages.set(data.bannerImages.map(resolveVariant));
        if (data.aboutImages?.length)  this._aboutImages.set(data.aboutImages.map(resolveVariant));
        if (data.heroColors?.length)   this._heroColors.set([...data.heroColors]);
        this._loading.set(false);
      },
      error: (): void => { this._loading.set(false); },
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  setTab(tab: Tab): void { this._tab.set(tab); }

  // ── Logo / Favicon ──────────────────────────────────────────────────────────

  triggerLogoUpload():    void { this.logoInputRef.nativeElement.value = '';    this.logoInputRef.nativeElement.click(); }
  triggerFaviconUpload(): void { this.faviconInputRef.nativeElement.value = ''; this.faviconInputRef.nativeElement.click(); }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const edited = await this._editorSvc.edit([input.files[0]]);
    if (!edited.length) return;
    this._uploadingLogo.set(true);
    this._uploadService.uploadImages('organizational', edited).pipe(takeUntil(this._destroy$)).subscribe({
      next: ([variant]) => {
        if (variant) { this.form.get('logoUrl')?.setValue(variant.md); this.form.markAsDirty(); }
        this._uploadingLogo.set(false);
      },
      error: () => this._uploadingLogo.set(false),
    });
  }

  async onFaviconSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const edited = await this._editorSvc.edit([input.files[0]]);
    if (!edited.length) return;
    this._uploadingFavicon.set(true);
    this._uploadService.uploadImages('organizational', edited).pipe(takeUntil(this._destroy$)).subscribe({
      next: ([variant]) => {
        if (variant) { this.form.get('faviconUrl')?.setValue(variant.thumb); this.form.markAsDirty(); }
        this._uploadingFavicon.set(false);
      },
      error: () => this._uploadingFavicon.set(false),
    });
  }

  // ── Hero videos ─────────────────────────────────────────────────────────────

  triggerHeroVideoUpload(): void { this.heroVideoInputRef.nativeElement.value = ''; this.heroVideoInputRef.nativeElement.click(); }

  onHeroVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this._uploadingHeroVideo.set(true);
    this._uploadService.uploadVideo(input.files[0]).pipe(takeUntil(this._destroy$)).subscribe({
      next: (video) => { this._heroVideos.update(l => [...l, video]); this._uploadingHeroVideo.set(false); this.form.markAsDirty(); },
      error: () => this._uploadingHeroVideo.set(false),
    });
  }

  removeHeroVideo(index: number): void { this._heroVideos.update(l => l.filter((_, i) => i !== index)); this.form.markAsDirty(); }

  // ── Hero images ──────────────────────────────────────────────────────────────

  triggerHeroImageUpload(): void { this.heroImageInputRef.nativeElement.value = ''; this.heroImageInputRef.nativeElement.click(); }

  async onHeroImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const edited = await this._editorSvc.edit(Array.from(input.files));
    if (!edited.length) return;
    this._uploadingHeroImage.set(true);
    this._uploadService.uploadImages('organizational', edited).pipe(takeUntil(this._destroy$)).subscribe({
      next: (variants) => { this._heroImages.update(l => [...l, ...variants]); this._uploadingHeroImage.set(false); this.form.markAsDirty(); },
      error: () => this._uploadingHeroImage.set(false),
    });
  }

  removeHeroImage(index: number): void { this._heroImages.update(l => l.filter((_, i) => i !== index)); this.form.markAsDirty(); }

  // ── Banner images ─────────────────────────────────────────────────────────────

  triggerBannerImageUpload(): void { this.bannerImageInputRef.nativeElement.value = ''; this.bannerImageInputRef.nativeElement.click(); }

  async onBannerImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const edited = await this._editorSvc.edit(Array.from(input.files));
    if (!edited.length) return;
    this._uploadingBannerImage.set(true);
    this._uploadService.uploadImages('organizational', edited).pipe(takeUntil(this._destroy$)).subscribe({
      next: (variants) => { this._bannerImages.update(l => [...l, ...variants]); this._uploadingBannerImage.set(false); this.form.markAsDirty(); },
      error: () => this._uploadingBannerImage.set(false),
    });
  }

  removeBannerImage(index: number): void { this._bannerImages.update(l => l.filter((_, i) => i !== index)); this.form.markAsDirty(); }

  // ── About images ──────────────────────────────────────────────────────────────

  triggerAboutImageUpload(): void { this.aboutImageInputRef.nativeElement.value = ''; this.aboutImageInputRef.nativeElement.click(); }

  async onAboutImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const edited = await this._editorSvc.edit(Array.from(input.files));
    if (!edited.length) return;
    this._uploadingAboutImage.set(true);
    this._uploadService.uploadImages('organizational', edited).pipe(takeUntil(this._destroy$)).subscribe({
      next: (variants) => { this._aboutImages.update(l => [...l, ...variants]); this._uploadingAboutImage.set(false); this.form.markAsDirty(); },
      error: () => this._uploadingAboutImage.set(false),
    });
  }

  removeAboutImage(index: number): void { this._aboutImages.update(l => l.filter((_, i) => i !== index)); this.form.markAsDirty(); }

  // ── Hero colors ───────────────────────────────────────────────────────────────

  addHeroColor(event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    if (!color || this._heroColors().length >= 15) return;
    this._heroColors.update(l => [...l, color]);
    this.form.markAsDirty();
    input.value = '';
  }

  removeHeroColor(index: number): void {
    this._heroColors.update(l => l.filter((_, i) => i !== index));
    this.form.markAsDirty();
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const body: UpdateOrganizationalDto = {
      ...this.form.getRawValue(),
      heroVideos:   this._heroVideos(),
      heroImages:   this._heroImages(),
      bannerImages: this._bannerImages(),
      aboutImages:  this._aboutImages(),
      heroColors:   this._heroColors(),
    };

    const req$: Observable<Organizational> = this._orgId
      ? this._organizationService.update(this._orgId, body)
      : this._organizationService.create(body as CreateOrganizationalDto);

    req$.subscribe({
      next: (data: Organizational): void => {
        if (data?.id) this._orgId = data.id;
        this._saving.set(false);
        this.form.markAsPristine();
      },
      error: (): void => { this._saving.set(false); },
    });
  }
}
