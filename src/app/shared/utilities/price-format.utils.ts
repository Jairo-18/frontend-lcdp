const FMT_SHORT = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const FMT_FULL  = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatCOP(value: number): string {
  return '$' + FMT_SHORT.format(value);
}

export function formatCOPFull(value: number): string {
  return FMT_FULL.format(value) + ' COP';
}
