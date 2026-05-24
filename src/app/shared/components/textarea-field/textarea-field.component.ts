import {
  Component,
  Input,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

let uid = 0;

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  host: { style: 'display: block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './textarea-field.component.html',
})
export class TextareaFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() rows = 3;
  @Input() required = false;
  @Input() readonly = false;
  @Input() resize = false;
  @Input() control: AbstractControl | null | undefined;

  protected readonly id = `field-${++uid}`;
  protected value = '';
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
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  protected get textareaClasses(): string {
    const base =
      'w-full rounded-xl border px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 transition-colors';
    const border = this.showError
      ? 'border-coral focus:ring-coral/20'
      : 'border-rule focus:ring-black/10';
    const resize = this.resize ? '' : 'resize-none';
    const disabled = this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    return [base, border, resize, disabled].filter(Boolean).join(' ');
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value = val;
    this.onChange(val);
  }

  protected onBlur(event: Event): void {
    if (!this.readonly) {
      const ta = event.target as HTMLTextAreaElement;
      const cleaned = ta.value.replace(/\t/g, ' ').replace(/[ \t]+$/gm, '').replace(/^\s+|\s+$/g, '');
      ta.value = cleaned;
      this.value = cleaned;
      this.onChange(cleaned);
    }
    this.onTouched();
  }

  writeValue(val: string | null): void {
    this.value = val ?? '';
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
