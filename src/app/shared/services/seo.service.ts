import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Organizational } from '@shared/interfaces/organizational.interface';

const DEFAULTS = {
  title: 'La Casa del Pintor',
  description:
    'Pinturería en Mocoa con amplia variedad de pinturas, herramientas y productos para hogar, construcción e industria.',
  keywords: 'pinturería Mocoa, pinturas Mocoa, La Casa del Pintor',
  url: 'https://lacasadelpintormocoa.com',
  image: 'https://lacasadelpintormocoa.com/assets/images/logo.jpg',
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly _meta: Meta = inject(Meta);
  private readonly _title: Title = inject(Title);

  applyFromOrg(org: Organizational | null): void {
    const title = org?.metaTitle || DEFAULTS.title;
    const description = org?.metaDescription || DEFAULTS.description;
    const keywords = org?.metaKeywords || DEFAULTS.keywords;
    const siteName = org?.name || DEFAULTS.title;
    const logoUrl = org?.logoUrl || DEFAULTS.image;

    this._title.setTitle(title);

    this._meta.updateTag({ name: 'description', content: description });
    this._meta.updateTag({ name: 'keywords', content: keywords });
    this._meta.updateTag({ name: 'author', content: siteName });

    this._meta.updateTag({ property: 'og:type', content: 'website' });
    this._meta.updateTag({ property: 'og:site_name', content: siteName });
    this._meta.updateTag({ property: 'og:title', content: title });
    this._meta.updateTag({ property: 'og:description', content: description });
    this._meta.updateTag({ property: 'og:url', content: DEFAULTS.url });
    this._meta.updateTag({ property: 'og:image', content: logoUrl });

    this._meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this._meta.updateTag({ name: 'twitter:title', content: title });
    this._meta.updateTag({ name: 'twitter:description', content: description });
    this._meta.updateTag({ name: 'twitter:image', content: logoUrl });
  }

  setPageTitle(pageTitle: string, org?: Organizational | null): void {
    const siteName = org?.name || DEFAULTS.title;
    this._title.setTitle(`${pageTitle} | ${siteName}`);
    this._meta.updateTag({
      property: 'og:title',
      content: `${pageTitle} | ${siteName}`,
    });
  }
}
