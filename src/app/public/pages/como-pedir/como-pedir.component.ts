import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-como-pedir',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './como-pedir.component.html',
})
export class ComoPedirComponent implements OnInit {
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);
  private readonly _sanitizer: DomSanitizer = inject(DomSanitizer);

  readonly videoUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }) => {
        const raw = org?.howToOrderVideoUrl;
        if (raw) this.videoUrl.set(this._sanitizer.bypassSecurityTrustResourceUrl(this._toEmbed(raw)));
      },
    });
  }

  private _toEmbed(url: string): string {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
  }
}
