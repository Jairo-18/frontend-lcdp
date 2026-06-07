import {
  Component,
  HostListener,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { ColorService } from '@shared/services/color.service';
import { Color } from '@shared/interfaces/color.interface';
import { Surface, RoomView, SurfaceConfig } from './room-render.types';
import { RoomSvgCanvasComponent } from './room-svg-canvas/room-svg-canvas.component';
import { RoomColorPickerComponent } from './room-color-picker/room-color-picker.component';

@Component({
  selector: 'app-room-render',
  standalone: true,
  imports: [RoomSvgCanvasComponent, RoomColorPickerComponent],
  templateUrl: './room-render.component.html',
  styleUrl: './room-render.component.scss',
})
export class RoomRenderComponent implements OnInit {
  private readonly _colorService = inject(ColorService);

  readonly close = output<void>();

  readonly colors = signal<Color[]>([]);
  readonly loading = signal(true);
  readonly activeSurface = signal<Surface>('wall-back');
  readonly activeView = signal<RoomView>('alcoba');

  // Interior wall colors (each wall independently)
  readonly wallLeft = signal('#F2ECE4');
  readonly wallBack = signal('#F2ECE4');
  readonly wallRight = signal('#F2ECE4');
  readonly ceiling = signal('#FAFAF7');
  readonly floor = signal('#C4A882');

  // Fachada: left and right halves
  readonly fachadaLeft = signal('#F2ECE4');
  readonly fachadaRight = signal('#F2ECE4');

  readonly views: { key: RoomView; label: string; icon: string }[] = [
    { key: 'alcoba', label: 'Alcoba', icon: 'bed' },
    { key: 'sala', label: 'Sala', icon: 'weekend' },
    { key: 'cocina', label: 'Cocina', icon: 'countertops' },
    { key: 'fachada', label: 'Fachada', icon: 'house' },
  ];

  get surfaces(): SurfaceConfig[] {
    if (this.activeView() === 'fachada') {
      return [
        { key: 'facade-left', label: 'Lado Izq.', icon: 'west', color: () => this.fachadaLeft(), set: (h) => this.fachadaLeft.set(h) },
        { key: 'facade-right', label: 'Lado Der.', icon: 'east', color: () => this.fachadaRight(), set: (h) => this.fachadaRight.set(h) },
        { key: 'ceiling', label: 'Cubierta', icon: 'roofing', color: () => this.ceiling(), set: (h) => this.ceiling.set(h) },
        { key: 'floor', label: 'Suelo', icon: 'grass', color: () => this.floor(), set: (h) => this.floor.set(h) },
      ];
    }
    return [
      { key: 'wall-left', label: 'Pared Izq.', icon: 'west', color: () => this.wallLeft(), set: (h) => this.wallLeft.set(h) },
      { key: 'wall-back', label: 'Pared Fondo', icon: 'format_paint', color: () => this.wallBack(), set: (h) => this.wallBack.set(h) },
      { key: 'wall-right', label: 'Pared Der.', icon: 'east', color: () => this.wallRight(), set: (h) => this.wallRight.set(h) },
      { key: 'ceiling', label: 'Techo', icon: 'roofing', color: () => this.ceiling(), set: (h) => this.ceiling.set(h) },
      { key: 'floor', label: 'Piso', icon: 'texture', color: () => this.floor(), set: (h) => this.floor.set(h) },
    ];
  }

  get activeSurfaceCfg(): SurfaceConfig {
    return this.surfaces.find((s) => s.key === this.activeSurface()) ?? this.surfaces[0];
  }

  ngOnInit(): void {
    this._colorService.getAll().subscribe({
      next: (colors) => {
        this.colors.set(colors);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setView(view: RoomView): void {
    this.activeView.set(view);
    this.activeSurface.set(view === 'fachada' ? 'facade-left' : 'wall-back');
  }

  selectColor(color: Color): void {
    this.activeSurfaceCfg.set(color.hex);
  }

  reset(): void {
    this.wallLeft.set('#F2ECE4');
    this.wallBack.set('#F2ECE4');
    this.wallRight.set('#F2ECE4');
    this.ceiling.set('#FAFAF7');
    this.floor.set('#C4A882');
    this.fachadaLeft.set('#F2ECE4');
    this.fachadaRight.set('#F2ECE4');
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close.emit();
  }
}
