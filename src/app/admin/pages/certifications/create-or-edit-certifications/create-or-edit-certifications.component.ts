import {
  Component, OnDestroy, OnInit, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent, TextareaFieldComponent } from '@shared/components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CertificationService } from '@shared/services/certification.service';
import { Certification, CertificationDto } from '@shared/interfaces/certification.interface';
import { CacheRouteReuseStrategy } from '@shared/strategies/cache-route-reuse.strategy';

@Component({
  selector: 'app-create-or-edit-certifications',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent, TextareaFieldComponent],
  templateUrl: './create-or-edit-certifications.component.html',
})
export class CreateOrEditCertificationsComponent implements OnInit, OnDestroy {
  private readonly _service: CertificationService = inject(CertificationService);
  private readonly _routeReuse: CacheRouteReuseStrategy = inject(CacheRouteReuseStrategy);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _destroy$: Subject<void> = new Subject<void>();

  readonly _loading   = signal(false);
  readonly _saving    = signal(false);
  readonly _editingId = signal<number | null>(null);

  readonly form = this._fb.nonNullable.group({
    name:          ['', [Validators.required, Validators.maxLength(200)]],
    normCode:      ['', [Validators.required, Validators.maxLength(100)]],
    certifyingBody:[''],
    description:   [''],
    imageUrl:      [''],
    sortOrder:     [0],
    isActive:      [true],
  });

  ngOnInit(): void {
    const idParam = this._route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this._editingId.set(id);

    if (id) {
      this._loading.set(true);
      this._service.getOne(id).pipe(takeUntil(this._destroy$)).subscribe({
        next: (cert: Certification) => {
          this.form.patchValue({
            name:           cert.name,
            normCode:       cert.normCode,
            certifyingBody: cert.certifyingBody ?? '',
            description:    cert.description ?? '',
            imageUrl:       cert.imageUrl ?? '',
            sortOrder:      cert.sortOrder,
            isActive:       cert.isActive,
          });
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  goBack(): void { this._router.navigate(['/admin/certifications']); }

  save(): void {
    if (this.form.invalid || this._saving()) return;
    this._saving.set(true);

    const raw = this.form.getRawValue();
    const dto: CertificationDto = {
      name:           raw.name,
      normCode:       raw.normCode,
      certifyingBody: raw.certifyingBody || undefined,
      description:    raw.description || undefined,
      imageUrl:       raw.imageUrl || undefined,
      sortOrder:      raw.sortOrder,
      isActive:       raw.isActive,
    };

    const onSuccess = (): void => { this._saving.set(false); this.form.markAsPristine(); this._routeReuse.invalidate('admin-certifications'); this.goBack(); };
    const onError   = (): void => this._saving.set(false);

    const id = this._editingId();
    if (id) {
      this._service.update(id, dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    } else {
      this._service.create(dto).pipe(takeUntil(this._destroy$)).subscribe({ next: onSuccess, error: onError });
    }
  }
}
