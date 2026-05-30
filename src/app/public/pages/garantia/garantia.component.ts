import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificationService } from '@shared/services/certification.service';
import { Certification } from '@shared/interfaces/certification.interface';

@Component({
  selector: 'app-garantia',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './garantia.component.html',
})
export class GarantiaComponent implements OnInit {
  private readonly _service: CertificationService = inject(CertificationService);

  readonly loading        = signal(true);
  readonly certifications = signal<Certification[]>([]);

  ngOnInit(): void {
    this._service.getAllActive().subscribe({
      next: (data) => { this.certifications.set(data); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }
}
