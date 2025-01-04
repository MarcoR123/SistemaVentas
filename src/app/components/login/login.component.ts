import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      alert('Por favor, ingresa un correo electrónico y una contraseña válidos.');
      return;
    }

    const formData = new FormData();
    formData.append('email', this.email);
    formData.append('password', this.password);

    this.authService.login(formData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('clientId', response.clientId);
        this.router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Error de login:', error);
        const errors = error.error?.errors || {};
        alert(
          errors.email?.join(', ') || 
          errors.password?.join(', ') || 
          'Error al iniciar sesión.'
        );
      },
    });
  }
}
