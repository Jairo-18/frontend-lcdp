import { Component, HostListener, inject } from '@angular/core';
import { ImagePreviewService } from '@shared/services/image-preview.service';

@Component({
  selector: 'app-image-preview',
  standalone: true,
  imports: [],
  templateUrl: './image-preview.component.html',
})
export class ImagePreviewComponent {
  readonly _svc = inject(ImagePreviewService);

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this._svc.visible()) return;
    if (e.key === 'Escape') this._svc.close();
    if (e.key === 'ArrowLeft') this._svc.prev();
    if (e.key === 'ArrowRight') this._svc.next();
  }
}
