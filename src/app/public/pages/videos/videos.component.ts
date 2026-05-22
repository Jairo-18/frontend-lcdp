import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './videos.component.html',
})
export class VideosComponent {}
