import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    standalone: false
})
export class NavbarComponent {
  constructor(private router: Router, private authService : AuthService) {}

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  
  isAdmin(): boolean {
    return localStorage.getItem('role') === 'Administrador';
  }
  
  isSupervisor(): boolean {
    return localStorage.getItem('role') === 'Supervisor';
  }
  
  isVendedor(): boolean {
    return localStorage.getItem('role') === 'Vendedor';
  }

  // NavbarComponent.ts
  logout(): void {
    console.log('Cerrando sesión...'); // Depuración
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  

}
