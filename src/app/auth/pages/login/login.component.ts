import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  readonly greeting = computed(() => this.auth.getCurrentUser()?.fullName?.split(' ')[0] ?? '');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    const { email, password, remember } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ email: email!, password: password! }, remember!).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Credenciales incorrectas.');
        this.loading.set(false);
      },
    });
  }
}
