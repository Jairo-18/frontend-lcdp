import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="font-display font-bold text-ink text-3xl">Dashboard</h1>
      <p class="text-ink-mute mt-2">Bienvenido al panel de administración.</p>
    </div>
  `,
})
export class DashboardComponent {}
