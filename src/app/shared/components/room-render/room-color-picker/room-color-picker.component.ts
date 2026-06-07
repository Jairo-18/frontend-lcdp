import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Color, ColorSurface } from '@shared/interfaces/color.interface';
import { Surface, SurfaceConfig } from '../room-render.types';

@Component({
  selector: 'app-room-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-color-picker.component.html',
  host: { style: 'display: contents' },
})
export class RoomColorPickerComponent {
  readonly colors = input.required<Color[]>();
  readonly activeSurface = input.required<Surface>();
  readonly surfaces = input.required<SurfaceConfig[]>();
  readonly activeSurfaceCfg = input.required<SurfaceConfig>();
  readonly loading = input.required<boolean>();

  searchQuery = '';

  readonly colorSelected = output<Color>();
  readonly surfaceSelected = output<Surface>();
  readonly resetClicked = output<void>();

  private get activeSurfaceType(): ColorSurface | null {
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
    const all = this.colors().filter((c) => {
      if (!c.isActive) return false;
      if (!c.surfaces || c.surfaces.length === 0) return true;
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
    return Array.from(map.entries()).map(([family, colors]) => ({ family, colors }));
  }

  isSelected(color: Color): boolean {
    return this.activeSurfaceCfg().color() === color.hex;
  }

  isLight(hex: string): boolean {
    if (!hex || hex.length < 7) return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186;
  }
}
