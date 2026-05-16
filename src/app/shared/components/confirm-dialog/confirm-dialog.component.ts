import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogData } from '@shared/interfaces/forms.interface';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-auto">
      @if (data.title) {
        <h3 class="font-semibold text-ink text-base mb-2">{{ data.title }}</h3>
      }
      <p class="text-sm text-ink-mute leading-relaxed mb-6">{{ data.message }}</p>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          (click)="cancel()"
          class="px-4 py-2 rounded-xl border border-rule text-sm font-semibold text-ink hover:bg-[rgba(26,28,44,0.04)] transition-colors cursor-pointer bg-white"
        >
          {{ data.cancelText ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          (click)="confirm()"
          [class]="confirmClasses"
        >
          {{ data.confirmText ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected get confirmClasses(): string {
    const base =
      'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer border-0';
    const color = this.data.danger
      ? 'bg-red-500 hover:bg-red-600'
      : 'bg-ink hover:bg-black';
    return `${base} ${color}`;
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
