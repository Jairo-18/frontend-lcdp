import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '@shared/services/notifications.service';
import { OrganizationalService } from '@shared/services/organizational.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly _formBuilder: FormBuilder = inject(FormBuilder);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _orgService: OrganizationalService = inject(OrganizationalService);
  private readonly _router: Router = inject(Router);
  private readonly _notificationsService: NotificationsService =
    inject(NotificationsService);

  readonly _loading: WritableSignal<boolean> = signal(false);
  readonly _showPassword: WritableSignal<boolean> = signal(false);
  readonly _logoUrl: WritableSignal<string> = signal('');

  readonly _greeting: Signal<string> = computed(
    () => this._authService.getCurrentUser()?.fullName?.split(' ')[0] ?? '',
  );

  ngOnInit(): void {
    this._orgService.bootstrap().subscribe({
      next: ({ org }) => {
        if (org?.logoUrl) this._logoUrl.set(org.logoUrl);
      },
    });
  }

  readonly form = this._formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  onSubmit(): void {
    if (this.form.invalid || this._loading()) return;

    const { email, password, remember } = this.form.getRawValue();
    this._loading.set(true);

    this._authService
      .login({ email: email!, password: password! }, remember!)
      .subscribe({
        next: () => this._router.navigate(['/admin/dashboard']),
        error: (err: { error?: { message?: string } }) => {
          this._notificationsService.error(
            err.error?.message ?? 'Credenciales incorrectas.',
          );
          this._loading.set(false);
        },
      });
  }
}
