import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductEditComponent } from './components/product-edit/product-edit.component';
import { SaleListComponent } from './components/sale-list/sale-list.component';
import { SaleFormComponent } from './components/sale-form/sale-form.component';
import { SaleEditComponent } from './components/sale-edit/sale-edit.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms'; // Importar forms module ngmodel 
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';  // Si lo necesitas en un módulo específico
import { UserListComponent } from './components/user-list/user-list.component';  // Importar componente de lista de usuarios
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserFormComponent } from './components/user-form/user-form.component';  // Importar componente de formulario de usuario
import { AuthGuard } from './guards/auth.guard';  
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';  // Importar componente de acceso no autorizado
import { NavbarComponent } from './components/navbar/navbar.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ClientEditComponent } from './components/client-edit/client-edit.component';
import { ReportsComponent } from './components/reports/reports.component';  // Importar componente de informes




@NgModule({
  declarations: [
    AppComponent,
    ProductListComponent,
    ProductFormComponent,
    ProductEditComponent,
    SaleListComponent,
    SaleFormComponent,
    SaleEditComponent,
    LoginComponent,
    UserListComponent,
    UserEditComponent,
    UserFormComponent,
    NavbarComponent,  
    UnauthorizedComponent,
    ClientListComponent,
    ClientFormComponent,
    ClientEditComponent,
    ReportsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule, 
    CommonModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
