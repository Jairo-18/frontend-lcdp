import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ImageEditorService } from '@shared/services/image-editor.service';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CornerHandle = 'nw' | 'ne' | 'sw' | 'se';
type Handle = CornerHandle | 'move';

interface DragState {
  handle: Handle;
  startX: number;
  startY: number;
  startCrop: CropRect;
}

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './image-editor.component.html',
})
export class ImageEditorComponent implements OnDestroy {
  readonly _svc: ImageEditorService = inject(ImageEditorService);

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapperRef') wrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  _img: HTMLImageElement | null = null;
  readonly _rotation = signal(0);
  readonly _flipH = signal(false);
  readonly _flipV = signal(false);
  readonly _cropMode = signal(false);
  readonly _crop = signal<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  readonly _confirming = signal(false);
  readonly _targetPx = signal<number | null>(null);

  private _dragState: DragState | null = null;
  private _drawStart: { x: number; y: number } | null = null;

  private readonly _effectRef = effect(() => {
    const files = this._svc.files();
    const idx = this._svc.currentIndex();
    const visible = this._svc.visible();
    if (visible && files[idx]) {
      this._loadFile(files[idx]);
    }
  });

  ngOnDestroy(): void {
    this._effectRef.destroy();
  }

  /** Returns crop output size in original image pixels (always square) */
  get _outputPx(): number | null {
    if (!this._img || !this.canvasRef?.nativeElement?.width) return null;
    const crop = this._crop();
    const canvas = this.canvasRef.nativeElement;
    const rot = this._rotation();
    const isSwapped = rot === 90 || rot === 270;
    const effW = isSwapped ? this._img.naturalHeight : this._img.naturalWidth;
    return Math.round(crop.w * (effW / canvas.width));
  }

  private _loadFile(file: File): void {
    this._rotation.set(0);
    this._flipH.set(false);
    this._flipV.set(false);
    this._cropMode.set(false);
    this._targetPx.set(null);
    this._confirming.set(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this._img = img;
        setTimeout(() => {
          this._render();
          this._initCrop();
        }, 0);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  private _render(): void {
    if (!this._img || !this.canvasRef) return;

    const img = this._img;
    const rot = this._rotation();
    const isSwapped = rot === 90 || rot === 270;

    const container = this.containerRef.nativeElement;
    const maxW = container.clientWidth - 48;
    const maxH = container.clientHeight - 48;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const effW = isSwapped ? natH : natW;
    const effH = isSwapped ? natW : natH;

    const scale = Math.min(maxW / effW, maxH / effH, 1);
    const displayW = Math.round(effW * scale);
    const displayH = Math.round(effH * scale);

    const canvas = this.canvasRef.nativeElement;
    canvas.width = displayW;
    canvas.height = displayH;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, displayW, displayH);
    ctx.save();
    ctx.translate(displayW / 2, displayH / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(this._flipH() ? -1 : 1, this._flipV() ? -1 : 1);
    ctx.drawImage(
      img,
      -(natW * scale) / 2,
      -(natH * scale) / 2,
      natW * scale,
      natH * scale,
    );
    ctx.restore();
  }

  /** Always initialises a centered square crop */
  private _initCrop(): void {
    if (!this.canvasRef) return;
    const { width, height } = this.canvasRef.nativeElement;
    const size = Math.round(Math.min(width, height) * 0.9);
    const x = Math.round((width - size) / 2);
    const y = Math.round((height - size) / 2);
    this._crop.set({ x, y, w: size, h: size });
  }

  rotate(deg: number): void {
    this._rotation.update((r) => (((r + deg) % 360) + 360) % 360);
    this._render();
    if (this._cropMode()) this._initCrop();
  }

  toggleFlipH(): void {
    this._flipH.update((v) => !v);
    this._render();
  }

  toggleFlipV(): void {
    this._flipV.update((v) => !v);
    this._render();
  }

  toggleCrop(): void {
    const next = !this._cropMode();
    this._cropMode.set(next);
    if (next) this._initCrop();
  }

  resetCrop(): void {
    this._initCrop();
  }

  resetAll(): void {
    this._rotation.set(0);
    this._flipH.set(false);
    this._flipV.set(false);
    this._cropMode.set(false);
    this._targetPx.set(null);
    this._render();
  }

  onTargetPxInput(value: string): void {
    const n = parseInt(value, 10);
    this._targetPx.set(n > 0 ? n : null);
  }

  onWrapperMouseDown(event: MouseEvent): void {
    if (!this._cropMode()) return;
    const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const crop = this._crop();
    const inside =
      x > crop.x && x < crop.x + crop.w && y > crop.y && y < crop.y + crop.h;
    if (inside) {
      this._dragState = {
        handle: 'move',
        startX: x,
        startY: y,
        startCrop: { ...crop },
      };
    } else {
      this._drawStart = { x, y };
    }
    event.preventDefault();
  }

  onHandleMouseDown(event: MouseEvent, handle: Handle): void {
    const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this._dragState = {
      handle,
      startX: x,
      startY: y,
      startCrop: { ...this._crop() },
    };
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this._cropMode() || (!this._dragState && !this._drawStart)) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, canvas.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, canvas.height));

    if (this._drawStart) {
      const { x: sx, y: sy } = this._drawStart;
      const size = Math.max(20, Math.max(Math.abs(x - sx), Math.abs(y - sy)));
      this._crop.set({
        x: x < sx ? sx - size : sx,
        y: y < sy ? sy - size : sy,
        w: size,
        h: size,
      });
      return;
    }

    if (!this._dragState) return;
    const { handle, startX, startY, startCrop: sc } = this._dragState;
    const dx = x - startX;
    const dy = y - startY;

    let { x: cx, y: cy, w: cw, h: ch } = sc;

    if (handle === 'move') {
      cx = Math.max(0, Math.min(cx + dx, canvas.width - cw));
      cy = Math.max(0, Math.min(cy + dy, canvas.height - ch));
    } else {
      // Square-constrained corner resize
      const fixedRight = sc.x + sc.w;
      const fixedBottom = sc.y + sc.h;

      if (handle === 'se') {
        const size = Math.max(20, Math.max(sc.w + dx, sc.h + dy));
        cw = size;
        ch = size;
      } else if (handle === 'sw') {
        const size = Math.max(20, Math.max(sc.w - dx, sc.h + dy));
        cx = fixedRight - size;
        cw = size;
        ch = size;
      } else if (handle === 'ne') {
        const size = Math.max(20, Math.max(sc.w + dx, sc.h - dy));
        cy = fixedBottom - size;
        cw = size;
        ch = size;
      } else if (handle === 'nw') {
        const size = Math.max(20, Math.max(sc.w - dx, sc.h - dy));
        cx = fixedRight - size;
        cy = fixedBottom - size;
        cw = size;
        ch = size;
      }

      // Clamp to canvas bounds, keep square
      if (cx < 0) cx = 0;
      if (cy < 0) cy = 0;
      cw = Math.min(cw, canvas.width - cx);
      ch = Math.min(ch, canvas.height - cy);
      const finalSize = Math.min(cw, ch);
      cw = finalSize;
      ch = finalSize;
    }

    this._crop.set({ x: cx, y: cy, w: cw, h: ch });
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this._dragState = null;
    this._drawStart = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this._svc.visible()) return;
    if (e.key === 'Escape') this._svc.cancel();
    if (e.key === 'Enter') this.confirm();
  }

  async confirm(): Promise<void> {
    if (!this._img || this._confirming()) return;
    this._confirming.set(true);
    const file = await this._exportFile();
    this._svc.confirm(file);
    this._confirming.set(false);
  }

  skip(): void {
    this._svc.skip();
  }

  private async _exportFile(): Promise<File> {
    const img = this._img!;
    const rot = this._rotation();
    const isSwapped = rot === 90 || rot === 270;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const effW = isSwapped ? natH : natW;
    const effH = isSwapped ? natW : natH;

    // Render full-resolution transformed image
    const offscreen = document.createElement('canvas');
    offscreen.width = effW;
    offscreen.height = effH;
    const ctx = offscreen.getContext('2d')!;
    ctx.save();
    ctx.translate(effW / 2, effH / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(this._flipH() ? -1 : 1, this._flipV() ? -1 : 1);
    ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
    ctx.restore();

    let finalCanvas = offscreen;

    if (this._cropMode()) {
      const crop = this._crop();
      const display = this.canvasRef.nativeElement;
      const scaleX = effW / display.width;
      const scaleY = effH / display.height;

      const cropX = Math.round(crop.x * scaleX);
      const cropY = Math.round(crop.y * scaleY);
      // crop is square: use average scale for pixel-perfect square output
      const cropPx = Math.max(1, Math.round(crop.w * ((scaleX + scaleY) / 2)));

      const cropped = document.createElement('canvas');
      cropped.width = cropPx;
      cropped.height = cropPx;
      cropped
        .getContext('2d')!
        .drawImage(
          offscreen,
          cropX,
          cropY,
          cropPx,
          cropPx,
          0,
          0,
          cropPx,
          cropPx,
        );
      finalCanvas = cropped;
    }

    // If user typed a target size, scale to it
    const targetPx = this._targetPx();
    if (targetPx && targetPx > 0) {
      const sized = document.createElement('canvas');
      sized.width = targetPx;
      sized.height = targetPx;
      sized.getContext('2d')!.drawImage(finalCanvas, 0, 0, targetPx, targetPx);
      finalCanvas = sized;
    }

    return new Promise<File>((resolve) => {
      finalCanvas.toBlob(
        (blob) => {
          const orig = this._svc.files()[this._svc.currentIndex()];
          const name = orig.name.replace(/\.[^.]+$/, '.png');
          resolve(new File([blob!], name, { type: 'image/png' }));
        },
        'image/png',
        0.95,
      );
    });
  }
}
