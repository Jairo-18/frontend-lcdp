import { Component, input } from '@angular/core';

@Component({
  selector: 'app-whatsapp-banner',
  standalone: true,
  templateUrl: './whatsapp-banner.component.html',
})
export class WhatsappBannerComponent {
  readonly whatsappHref = input<string>('#');
}
