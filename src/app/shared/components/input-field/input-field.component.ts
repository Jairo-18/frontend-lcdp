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

const FMT = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toTitleCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatCurrency(raw: string): string {
  const clean = raw.replace(/[^0-9,]/g, '');
  const [intPart = '', decPart] = clean.split(',');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${intFormatted},${decPart}` : intFormatted;
}

function parseRaw(formatted: string): number | null {
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

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
  @Input() currency = false;
  @Input() titleCase = false;
  @Input() upperCase = false;
  @Input() control: AbstractControl | null | undefined;

  protected readonly id = `field-${++uid}`;
  protected readonly _value = signal('');
  protected isDisabled = false;

  private onChange: (v: any) => void = () => {};
  protected onTouched: () => void = () => {};

  protected get resolvedType(): string {
    return this.currency ? 'text' : this.type;
  }

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
    const readonly = this.readonly && !this.isDisabled ? 'bg-[#f5f5f5] cursor-default select-all' : '';
    return [base, border, mono, disabled, readonly].filter(Boolean).join(' ');
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.currency) {
      const formatted = formatCurrency(input.value);
      input.value = formatted;
      this._value.set(formatted);
      this.onChange(parseRaw(formatted));
    } else {
      this._value.set(input.value);
      this.onChange(input.value);
    }
  }

  protected onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value && !this.currency && this.type !== 'password') {
      let v = input.value.trim().replace(/\s+/g, ' ');
      if (this.titleCase) v = toTitleCase(v);
      else if (this.upperCase) v = v.toUpperCase();
      if (v !== input.value) {
        input.value = v;
        this._value.set(v);
        this.onChange(v);
      }
    }
    this.onTouched();
  }

  writeValue(val: any): void {
    if (this.currency && val != null && val !== '') {
      const n = Number(val);
      this._value.set(isNaN(n) ? '' : FMT.format(n));
    } else {
      this._value.set(val ?? '');
    }
  }

  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
  }
}
