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

let uid = 0;

@Component({
  selector: 'app-input-field',
  standalone: true,
  host: { style: 'display: block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './input-field.component.html',
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() readonly = false;
  @Input() mono = false;
  @Input() control: AbstractControl | null | undefined;

  protected readonly id = `field-${++uid}`;
  protected readonly _value = signal('');
  protected isDisabled = false;

  private onChange: (v: string) => void = () => {};
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
    if (e['email']) return 'Correo electrónico inválido';
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    if (e['pattern']) return 'Formato inválido';
    return 'Campo inválido';
  }

  protected get inputClasses(): string {
    const base =
      'w-full rounded-xl border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 transition-colors';
    const border = this.showError
      ? 'border-coral focus:ring-coral/20'
      : 'border-rule focus:ring-black/10';
    const mono = this.mono ? 'font-mono' : '';
    const disabled = this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    return [base, border, mono, disabled].filter(Boolean).join(' ');
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this._value.set(val);
    this.onChange(val);
  }

  writeValue(val: string | null): void {
    this._value.set(val ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
  }
}
