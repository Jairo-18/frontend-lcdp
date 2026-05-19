import { environment } from '@env/environment';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';

function resolveUrl(url: string): string {
  return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
}

export function resolveVariant(v: ImageVariant): ImageVariant {
  return {
    thumb: resolveUrl(v.thumb),
    md: resolveUrl(v.md),
    lg: resolveUrl(v.lg),
  };
}
