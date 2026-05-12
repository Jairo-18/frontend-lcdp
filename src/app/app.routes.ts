import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [],
  },
];
