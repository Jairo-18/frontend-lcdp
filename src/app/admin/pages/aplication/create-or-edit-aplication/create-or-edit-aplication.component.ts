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
import {
  Organizational,
  UpdateOrganizationalDto,
  CreateOrganizationalDto,
} from '@shared/interfaces/organizational.interface';
import {
  Tab,
  TabItem,
  ColorField,
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
  readonly _previewSvc: ImagePreviewService = inject(ImagePreviewService);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  @ViewChild('logoInput') logoInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('faviconInput') faviconInputRef!: ElementRef<HTMLInputElement>;

  readonly _loading: WritableSignal<boolean> = signal(false);
  readonly _saving: WritableSignal<boolean> = signal(false);
  readonly _tab: WritableSignal<Tab> = signal('general');
  readonly _uploadingLogo = signal(false);
  readonly _uploadingFavicon = signal(false);

  private _orgId: string | null = null;

  readonly tabs: TabItem[] = [
    { id: 'general', label: 'General', icon: 'storefront' },
    { id: 'branding', label: 'Identidad visual', icon: 'palette' },
    { id: 'redes', label: 'Redes sociales', icon: 'share' },
    { id: 'contenido', label: 'Contenido', icon: 'article' },
    { id: 'seo', label: 'SEO', icon: 'travel_explore' },
  ];

  readonly colorFields: ColorField[] = [
    { key: 'primaryColor', label: 'Primario' },
    { key: 'secondaryColor', label: 'Secundario' },
    { key: 'accentColor', label: 'Acento' },
    { key: 'bgColor', label: 'Fondo' },
    { key: 'textColor', label: 'Texto' },
  ];

  readonly socialFields: SocialField[] = [
    { key: 'facebookUrl', label: 'Facebook', icon: 'thumb_up', placeholder: 'https://facebook.com/...' },
    { key: 'instagramUrl', label: 'Instagram', icon: 'photo_camera', placeholder: 'https://instagram.com/...' },
    { key: 'youtubeUrl', label: 'YouTube', icon: 'play_circle', placeholder: 'https://youtube.com/...' },
    { key: 'tiktokUrl', label: 'TikTok', icon: 'music_note', placeholder: 'https://tiktok.com/@...' },
    { key: 'mapsUrl', label: 'Google Maps', icon: 'location_on', placeholder: 'https://maps.google.com/...' },
  ];

  readonly form = this._formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    legalName: ['', Validators.maxLength(150)],
    nit: ['', Validators.maxLength(50)],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phone: ['', Validators.maxLength(25)],
    whatsappNumber: ['', Validators.maxLength(25)],
    website: ['', Validators.maxLength(200)],
    address: ['', Validators.maxLength(200)],
    city: ['', Validators.maxLength(100)],
    department: ['', Validators.maxLength(100)],
    logoUrl: ['', Validators.maxLength(500)],
    faviconUrl: ['', Validators.maxLength(500)],
    primaryColor: ['', Validators.maxLength(20)],
    secondaryColor: ['', Validators.maxLength(20)],
    accentColor: ['', Validators.maxLength(20)],
    bgColor: ['', Validators.maxLength(20)],
    textColor: ['', Validators.maxLength(20)],
    facebookUrl: ['', Validators.maxLength(500)],
    instagramUrl: ['', Validators.maxLength(500)],
    youtubeUrl: ['', Validators.maxLength(500)],
    tiktokUrl: ['', Validators.maxLength(500)],
    mapsUrl: ['', Validators.maxLength(500)],
    description: [''],
    aboutTitle: ['', Validators.maxLength(200)],
    aboutDescription: [''],
    missionTitle: ['', Validators.maxLength(200)],
    missionDescription: [''],
    visionTitle: ['', Validators.maxLength(200)],
    visionDescription: [''],
    metaTitle: ['', Validators.maxLength(200)],
    metaDescription: [''],
    metaKeywords: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this._loading.set(true);
    this._organizationService.get().subscribe({
      next: (data: Organizational): void => {
        this._orgId = data.id;
        this.form.patchValue(data);
        this._loading.set(false);
      },
      error: (): void => {
        this._loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  setTab(tab: Tab): void {
    this._tab.set(tab);
  }

  triggerLogoUpload(): void {
    this.logoInputRef.nativeElement.value = '';
    this.logoInputRef.nativeElement.click();
  }

  triggerFaviconUpload(): void {
    this.faviconInputRef.nativeElement.value = '';
    this.faviconInputRef.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this._uploadingLogo.set(true);
    this._uploadService
      .uploadImages('organizational', [input.files[0]])
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ([variant]) => {
          if (variant) {
            this.form.get('logoUrl')?.setValue(variant.md);
            this.form.markAsDirty();
          }
          this._uploadingLogo.set(false);
        },
        error: () => this._uploadingLogo.set(false),
      });
  }

  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this._uploadingFavicon.set(true);
    this._uploadService
      .uploadImages('organizational', [input.files[0]])
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ([variant]) => {
          if (variant) {
            this.form.get('faviconUrl')?.setValue(variant.thumb);
            this.form.markAsDirty();
          }
          this._uploadingFavicon.set(false);
        },
        error: () => this._uploadingFavicon.set(false),
      });
  }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const body: UpdateOrganizationalDto = this.form.getRawValue();
    const req$: Observable<Organizational> = this._orgId
      ? this._organizationService.update(this._orgId, body)
      : this._organizationService.create(body as CreateOrganizationalDto);

    req$.subscribe({
      next: (data: Organizational): void => {
        if (data?.id) this._orgId = data.id;
        this._saving.set(false);
      },
      error: (): void => {
        this._saving.set(false);
      },
    });
  }
}
