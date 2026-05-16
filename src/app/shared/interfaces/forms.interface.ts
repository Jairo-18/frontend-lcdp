export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}
