import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Surface, RoomView } from '../room-render.types';

@Component({
  selector: 'app-room-svg-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-svg-canvas.component.html',
  host: { style: 'display: contents' },
})
export class RoomSvgCanvasComponent {
  readonly activeView = input.required<RoomView>();
  readonly activeSurface = input.required<Surface>();
  readonly floor = input.required<string>();
  readonly ceiling = input.required<string>();
  readonly wallLeft = input.required<string>();
  readonly wallBack = input.required<string>();
  readonly wallRight = input.required<string>();
  readonly fachadaLeft = input.required<string>();
  readonly fachadaRight = input.required<string>();
  readonly views = input.required<{ key: RoomView; label: string; icon: string }[]>();

  readonly surfaceClicked = output<Surface>();
  readonly viewChanged = output<RoomView>();
}
