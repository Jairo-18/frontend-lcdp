import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Organizational } from '@shared/interfaces/organizational.interface';

interface Stat { value: string; label: string }

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  readonly org = input<Organizational | null>(null);
  readonly whatsappHref = input<string>('#');
  readonly stats = input<Stat[]>([]);
}
