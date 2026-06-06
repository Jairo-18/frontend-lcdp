import {
  Component,
  HostListener,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorService } from '@shared/services/color.service';
import { Color, ColorSurface } from '@shared/interfaces/color.interface';

type Surface =
  | 'wall-left' | 'wall-back' | 'wall-right'
  | 'ceiling' | 'floor'
  | 'facade-left' | 'facade-right';

type RoomView = 'alcoba' | 'sala' | 'cocina' | 'fachada';

interface SurfaceConfig {
  key: Surface;
  label: string;
  icon: string;
  color: () => string;
  set: (h: string) => void;
}

@Component({
  selector: 'app-room-render',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  searchQuery = '';

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

  get activeSurfaceType(): ColorSurface | null {
    const s = this.activeSurface();
    if (s === 'floor') return 'piso';
    if (s === 'ceiling') return 'techo';
    if (s === 'wall-left' || s === 'wall-back' || s === 'wall-right' ||
      s === 'facade-left' || s === 'facade-right') return 'pared';
    return null;
  }

  get filteredColors(): Color[] {
    const q = this.searchQuery.toLowerCase().trim();
    const surfaceType = this.activeSurfaceType;

    let all = this.colors().filter((c) => {
      if (!c.isActive) return false;
      // Si el color no tiene superficies definidas, aplica a todo
      if (!c.surfaces || c.surfaces.length === 0) return true;
      // Si tiene superficies, solo mostrar si coincide con la superficie activa
      return surfaceType ? c.surfaces.includes(surfaceType) : true;
    });

    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code?.toLowerCase().includes(q) ?? false) ||
        (c.colorFamily?.toLowerCase().includes(q) ?? false),
    );
  }

  get colorsByFamily(): { family: string; colors: Color[] }[] {
    const map = new Map<string, Color[]>();
    for (const c of this.filteredColors) {
      const fam = c.colorFamily ?? 'Otros';
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push(c);
    }
    return Array.from(map.entries()).map(([family, colors]) => ({
      family,
      colors,
    }));
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

  isSelected(color: Color): boolean {
    return this.activeSurfaceCfg.color() === color.hex;
  }

  isLight(hex: string): boolean {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186;
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
