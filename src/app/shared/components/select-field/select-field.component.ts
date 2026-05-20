import {
  Component,
  Input,
  forwardRef,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { SelectOption } from '@shared/interfaces/forms.interface';

let uid = 0;

@Component({
  selector: 'app-select-field',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
  template: `
    @if (label) {
      <label [for]="id" class="block text-sm font-medium text-ink mb-1">
        {{ label }}@if (required) {<span class="text-coral"> *</span>}
      </label>
    }
    <select
      [id]="id"
      [disabled]="isDisabled"
      (change)="onSelect($event)"
      (blur)="onTouched()"
      [class]="selectClasses"
    >
      @if (placeholder) {
        <option value="">{{ placeholder }}</option>
      }
      @for (opt of options; track opt.value) {
        <option [value]="opt.value" [selected]="opt.value == _value()">{{ opt.label }}</option>
      }
    </select>
    @if (hint && !showError) {
      <p class="text-xs text-ink-mute mt-1">{{ hint }}</p>
    }
    @if (showError) {
      <p class="text-xs text-coral mt-1">{{ resolvedError }}</p>
    }
  `,
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() options: SelectOption[] = [];
  @Input() control: AbstractControl | null | undefined;

  protected readonly id = `field-${++uid}`;
  protected readonly _value = signal<string | number>('');
  protected isDisabled = false;

  private onChange: (v: string | number) => void = () => {};
  protected onTouched: () => void = () => {};

  protected get showError(): boolean {
    if (this.error) return true;
    return !!(this.control?.touched && this.control?.invalid);
  }

  protected get resolvedError(): string {
    if (this.error) return this.error;
    const e = this.control?.errors;
    if (!e) return '';
    if (e['required']) return 'Este campo es requerido';
    return 'Campo inválido';
  }

  protected get selectClasses(): string {
    const base =
      'w-full rounded-xl border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer';
    const border = this.showError
      ? 'border-coral focus:ring-coral/20'
      : 'border-rule focus:ring-black/10';
    const disabled = this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    return [base, border, disabled].filter(Boolean).join(' ');
  }

  protected onSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this._value.set(val);
    this.onChange(val);
  }

  writeValue(val: string | number | null): void {
    this._value.set(val ?? '');
  }
  registerOnChange(fn: (v: string | number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
  }
}
