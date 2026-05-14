import {
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { OrganizationalService } from '@shared/services/organizational.service';
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
  OrgFormGroup,
} from '@shared/interfaces/aplication.interface';

@Component({
  selector: 'app-aplication',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './aplication.component.html',
})
export class AplicationComponent implements OnInit {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _organizationService: OrganizationalService = inject(
    OrganizationalService,
  );

  readonly _loading: WritableSignal<boolean> = signal(false);
  readonly _saving: WritableSignal<boolean> = signal(false);
  readonly _tab: WritableSignal<Tab> = signal('general');

  private _orgId: string | null = null;

  readonly tabs: TabItem[] = [
    { id: 'general', label: 'General', icon: 'storefront' },
    { id: 'branding', label: 'Branding', icon: 'palette' },
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
    {
      key: 'facebookUrl',
      label: 'Facebook',
      icon: 'thumb_up',
      placeholder: 'https://facebook.com/...',
    },
    {
      key: 'instagramUrl',
      label: 'Instagram',
      icon: 'photo_camera',
      placeholder: 'https://instagram.com/...',
    },
    {
      key: 'youtubeUrl',
      label: 'YouTube',
      icon: 'play_circle',
      placeholder: 'https://youtube.com/...',
    },
    {
      key: 'tiktokUrl',
      label: 'TikTok',
      icon: 'music_note',
      placeholder: 'https://tiktok.com/@...',
    },
    {
      key: 'mapsUrl',
      label: 'Google Maps',
      icon: 'location_on',
      placeholder: 'https://maps.google.com/...',
    },
  ];

  readonly form: OrgFormGroup = this._formBuilder.nonNullable.group({
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
  }) as unknown as OrgFormGroup;

  ngOnInit(): void {
    this._loading.set(true);
    this._organizationService.get().subscribe({
      next: (data: Organizational | null): void => {
        if (data) {
          this._orgId = data.id;
          const clean: Record<string, string> = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v ?? '']),
          );
          this.form.patchValue(clean as never);
        }
        this._loading.set(false);
      },
      error: (): void => {
        this._loading.set(false);
      },
    });
  }

  setTab(tab: Tab): void {
    this._tab.set(tab);
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
