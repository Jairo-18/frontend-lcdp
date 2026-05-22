import { Component } from '@angular/core';

interface Announcement {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  styles: [
    `
      .marquee-wrapper {
        overflow: hidden;
        white-space: nowrap;
      }
      .marquee-track {
        display: inline-flex;
        animation: marquee 28s linear infinite;
      }
      .marquee-track:hover {
        animation-play-state: paused;
      }
      @keyframes marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
    `,
  ],
  templateUrl: './announcement-bar.component.html',
})
export class AnnouncementBarComponent {
  protected readonly items: Announcement[] = [
    { icon: '🏠', text: 'Servicio a domicilio' },
    { icon: '🚚', text: 'Envíos nacionales a todo Colombia' },
    { icon: '💳', text: 'Paga en cuotas con ADDI' },
    { icon: '💰', text: 'Financia tu compra con Sistecredito' },
    { icon: '🎨', text: 'Asesoría personalizada en color y acabados' },
  ];
}
