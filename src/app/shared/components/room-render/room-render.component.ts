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
import { Color } from '@shared/interfaces/color.interface';

type Surface = 'pared' | 'techo' | 'piso';

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
  readonly activeSurface = signal<Surface>('pared');

  searchQuery = '';

  readonly wallColor = signal('#F2ECE4');
  readonly ceilingColor = signal('#FAFAF7');
  readonly floorColor = signal('#C4A882');

  readonly surfaces = [
    {
      key: 'pared' as Surface,
      label: 'Paredes',
      icon: 'format_paint',
      color: () => this.wallColor(),
      set: (h: string) => this.wallColor.set(h),
    },
    {
      key: 'techo' as Surface,
      label: 'Techo',
      icon: 'roofing',
      color: () => this.ceilingColor(),
      set: (h: string) => this.ceilingColor.set(h),
    },
    {
      key: 'piso' as Surface,
      label: 'Piso',
      icon: 'texture',
      color: () => this.floorColor(),
      set: (h: string) => this.floorColor.set(h),
    },
  ];

  get activeSurfaceCfg() {
    return this.surfaces.find((s) => s.key === this.activeSurface())!;
  }

  get filteredColors(): Color[] {
    const q = this.searchQuery.toLowerCase().trim();
    const all = this.colors().filter((c) => c.isActive);
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
    this.wallColor.set('#F2ECE4');
    this.ceilingColor.set('#FAFAF7');
    this.floorColor.set('#C4A882');
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close.emit();
  }
}
