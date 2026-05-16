import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogData } from '@shared/interfaces/forms.interface';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: ConfirmDialogData): Observable<boolean> {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data,
        panelClass: 'confirm-dialog-panel',
        maxWidth: '90vw',
        width: '400px',
        disableClose: false,
      },
    );
    return ref.afterClosed() as Observable<boolean>;
  }

  /** Shorthand para confirmaciones de eliminación */
  confirmDelete(itemName?: string): Observable<boolean> {
    return this.open({
      title: '¿Eliminar?',
      message: itemName
        ? `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`
        : '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
    });
  }
}
