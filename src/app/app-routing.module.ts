import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductEditComponent } from './components/product-edit/product-edit.component';
import { SaleListComponent } from './components/sale-list/sale-list.component';
import { SaleFormComponent } from './components/sale-form/sale-form.component';
import { SaleEditComponent } from './components/sale-edit/sale-edit.component';
import { LoginComponent } from './components/login/login.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { AuthGuard } from './guards/auth.guard';
import { ClientListComponent } from './components/client-list/client-list.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ClientEditComponent } from './components/client-edit/client-edit.component';
import { ReportsComponent } from './components/reports/reports.component';
import { CustomerSupportService } from './services/customer-support.service';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'products',
    component: ProductListComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'products/new',
    component: ProductFormComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'products/edit/:id',
    component: ProductEditComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'sales',
    component: SaleListComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'sales/create',
    component: SaleFormComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'sales/edit/:id',
    component: SaleEditComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'users/create',
    component: UserFormComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'users/edit/:id',
    component: UserEditComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'clients',
    component: ClientListComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'clients/create',
    component: ClientFormComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'clients/edit/:id',
    component: ClientEditComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador'] }, // Permitido solo para Administrador
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [AuthGuard],
    data: { role: ['Administrador', 'Supervisor'] }, // Permitido para Administrador y Supervisor
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/login' },
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
