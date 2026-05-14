import { FormControl, FormGroup } from '@angular/forms';
import { UpdateOrganizationalDto } from '@shared/interfaces/organizational.interface';

export type Tab = 'general' | 'branding' | 'redes' | 'contenido' | 'seo';

export interface TabItem {
  id: Tab;
  label: string;
  icon: string;
}

export interface ColorField {
  key: keyof UpdateOrganizationalDto;
  label: string;
}

export interface SocialField {
  key: keyof UpdateOrganizationalDto;
  label: string;
  icon: string;
  placeholder: string;
}

export type OrgFormGroup = FormGroup<{
  name:               FormControl<string>;
  legalName:          FormControl<string>;
  nit:                FormControl<string>;
  email:              FormControl<string>;
  phone:              FormControl<string>;
  whatsappNumber:     FormControl<string>;
  website:            FormControl<string>;
  address:            FormControl<string>;
  city:               FormControl<string>;
  department:         FormControl<string>;
  logoUrl:            FormControl<string>;
  faviconUrl:         FormControl<string>;
  primaryColor:       FormControl<string>;
  secondaryColor:     FormControl<string>;
  accentColor:        FormControl<string>;
  bgColor:            FormControl<string>;
  textColor:          FormControl<string>;
  facebookUrl:        FormControl<string>;
  instagramUrl:       FormControl<string>;
  youtubeUrl:         FormControl<string>;
  tiktokUrl:          FormControl<string>;
  mapsUrl:            FormControl<string>;
  description:        FormControl<string>;
  aboutTitle:         FormControl<string>;
  aboutDescription:   FormControl<string>;
  missionTitle:       FormControl<string>;
  missionDescription: FormControl<string>;
  visionTitle:        FormControl<string>;
  visionDescription:  FormControl<string>;
  metaTitle:          FormControl<string>;
  metaDescription:    FormControl<string>;
  metaKeywords:       FormControl<string>;
}>;
