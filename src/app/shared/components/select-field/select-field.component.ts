import {
  Component,
  ElementRef,
  HostListener,
  Input,
  PLATFORM_ID,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  host: { style: 'display: block; position: relative' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './select-field.component.html',
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() options: SelectOption[] = [];
  @Input() control: AbstractControl | null | undefined;

  private readonly _el: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly _platformId: object = inject(PLATFORM_ID);

  protected readonly id = `field-${++uid}`;
  protected readonly _value = signal<string | number>('');
  protected readonly _open = signal(false);
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

  protected get selectedLabel(): string {
    const opt = this.options.find(o => String(o.value) === String(this._value()));
    if (opt) return opt.label;
    return this.placeholder || 'Seleccionar';
  }

  protected get hasValue(): boolean {
    const v = this._value();
    return v !== '' && v !== null && v !== undefined;
  }

  protected get triggerClasses(): string {
    const base =
      'w-full flex items-center justify-between gap-2 rounded-xl border pl-3 pr-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer text-left';
    const border = this.showError
      ? 'border-coral focus:ring-coral/20'
      : 'border-rule focus:ring-black/10';
    const color = this.hasValue ? 'text-ink' : 'text-ink-mute';
    const disabled = this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    return [base, border, color, disabled].filter(Boolean).join(' ');
  }

  protected toggle(): void {
    if (this.isDisabled) return;
    this._open.update(v => !v);
    this.onTouched();
  }

  protected select(value: string | number): void {
    this._value.set(value);
    this.onChange(value);
    this._open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!this._el.nativeElement.contains(event.target as Node)) {
      this._open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this._open.set(false);
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
