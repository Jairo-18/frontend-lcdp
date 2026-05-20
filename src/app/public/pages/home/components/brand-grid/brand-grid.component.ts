import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Brand } from '@shared/interfaces/brand.interface';

const PALETTE: readonly string[] = ['#1a56db','#d93025','#1e7e34','#7c3aed','#b45309','#0891b2'];

@Component({
  selector: 'app-brand-grid',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './brand-grid.component.html',
})
export class BrandGridComponent {
  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLElement>;
  @Input() brands: Brand[] = [];

  firstImage(brand: Brand): string | null {
    return brand.images?.[0]?.md ?? null;
  }

  color(index: number): string {
    return PALETTE[index % PALETTE.length];
  }

  scroll(dir: 1 | -1): void {
    this.scrollEl.nativeElement.scrollBy({ left: dir * 360, behavior: 'smooth' });
  }
}
