import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImagePreviewService {
  readonly images  = signal<string[]>([]);
  readonly index   = signal(0);
  readonly visible = signal(false);

  open(images: string[], index = 0): void {
    if (!images.length) return;
    this.images.set(images);
    this.index.set(index);
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  setIndex(i: number): void {
    this.index.set(i);
  }

  prev(): void {
    const len = this.images().length;
    this.index.update((i) => (i > 0 ? i - 1 : len - 1));
  }

  next(): void {
    const len = this.images().length;
    this.index.update((i) => (i < len - 1 ? i + 1 : 0));
  }
}
