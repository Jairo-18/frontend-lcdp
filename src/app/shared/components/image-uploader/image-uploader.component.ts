import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UploadService } from '@shared/services/upload.service';
import { ImagePreviewService } from '@shared/services/image-preview.service';
import { ImageEditorService } from '@shared/services/image-editor.service';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { UploadFolder } from '@shared/interfaces/upload.interface';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [],
  templateUrl: './image-uploader.component.html',
})
export class ImageUploaderComponent implements OnDestroy {
  private readonly _uploadService = inject(UploadService);
  private readonly _previewSvc = inject(ImagePreviewService);
  private readonly _editorSvc = inject(ImageEditorService);
  private readonly _destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  @Input() folder!: UploadFolder;
  @Input() images: ImageVariant[] = [];
  @Input() label = 'Imágenes';
  @Input() multiple = true;
  @Output() imagesChange = new EventEmitter<ImageVariant[]>();

  readonly _uploading = signal(false);
  readonly _previewIndex = signal(0);

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const rawFiles = Array.from(input.files);

    const editedFiles = await this._editorSvc.edit(rawFiles);
    if (!editedFiles.length) return;

    const prevLen = this.images.length;
    this._uploading.set(true);
    this._uploadService
      .uploadImages(this.folder, editedFiles)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (variants) => {
          const updated = [...this.images, ...variants];
          this.imagesChange.emit(updated);
          if (prevLen === 0) this._previewIndex.set(0);
        },
        error: () => this._uploading.set(false),
        complete: () => this._uploading.set(false),
      });
  }

  selectPreview(index: number): void {
    this._previewIndex.set(index);
  }

  openLightbox(index: number): void {
    this._previewSvc.open(this.images.map((i) => i.md), index);
  }

  removeImage(index: number): void {
    const updated = this.images.filter((_, i) => i !== index);
    this.imagesChange.emit(updated);
    const newLen = updated.length;
    if (this._previewIndex() >= newLen) {
      this._previewIndex.set(Math.max(0, newLen - 1));
    }
  }
}
