import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageEditorService {
  readonly visible = signal(false);
  readonly files = signal<File[]>([]);
  readonly currentIndex = signal(0);

  private _resolve: ((files: File[]) => void) | null = null;
  private _editedFiles: File[] = [];

  edit(files: File[]): Promise<File[]> {
    if (!files.length) return Promise.resolve([]);
    return new Promise(resolve => {
      this._resolve = resolve;
      this._editedFiles = [];
      this.files.set(files);
      this.currentIndex.set(0);
      this.visible.set(true);
    });
  }

  confirm(editedFile: File): void {
    this._editedFiles.push(editedFile);
    this._advance();
  }

  skip(): void {
    this._editedFiles.push(this.files()[this.currentIndex()]);
    this._advance();
  }

  private _advance(): void {
    const next = this.currentIndex() + 1;
    if (next < this.files().length) {
      this.currentIndex.set(next);
    } else {
      this.visible.set(false);
      this._resolve?.(this._editedFiles);
      this._resolve = null;
      this._editedFiles = [];
    }
  }

  cancel(): void {
    this.visible.set(false);
    this._resolve?.([]);
    this._resolve = null;
    this._editedFiles = [];
  }
}
