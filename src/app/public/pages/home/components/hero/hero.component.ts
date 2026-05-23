import { Component, computed, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Organizational } from '@shared/interfaces/organizational.interface';
import { VideoVariant } from '@shared/interfaces/image-variant.interface';

interface Stat { value: string; label: string }

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  readonly org          = input<Organizational | null>(null);
  readonly whatsappHref = input<string>('#');
  readonly stats        = input<Stat[]>([]);

  readonly _currentIndex = signal(0);
  readonly _heroVideos   = computed(() => this.org()?.heroVideos ?? []);
  readonly _hasVideos    = computed(() => this._heroVideos().length > 0);
  readonly _currentVideo = computed<VideoVariant | null>(() => {
    const list = this._heroVideos();
    return list.length ? list[this._currentIndex()] : null;
  });

  onVideoEnded(): void {
    const count = this._heroVideos().length;
    if (count <= 1) return;
    this._currentIndex.update((i) => (i + 1) % count);
  }

  goTo(index: number): void {
    this._currentIndex.set(index);
  }
}
