import { environment } from '@env/environment';
import { ImageVariant, VideoVariant } from '@shared/interfaces/image-variant.interface';

export function resolveUrl(url: string): string {
  return url.startsWith('http') ? url : `${environment.apiUrl}${url}`;
}

export function resolveVariant(v: ImageVariant): ImageVariant {
  return {
    thumb: resolveUrl(v.thumb),
    md: resolveUrl(v.md),
    lg: resolveUrl(v.lg),
  };
}

export function resolveVideoVariant(v: VideoVariant): VideoVariant {
  return {
    url: resolveUrl(v.url),
    poster: resolveUrl(v.poster),
  };
}
