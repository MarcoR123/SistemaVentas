import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']); // Redirigir al login si no está autenticado
    }

    // Obtener el rol del usuario y los roles permitidos para la ruta
    
    const userRole = this.authService.getRole() ?? ''; // Asignar un valor por defecto en caso de null
    const allowedRoles = route.data['role'] as string[]; // Roles permitidos para la ruta

    // Si la ruta no especifica roles, permitir el acceso
    if (!allowedRoles) {
      return true;
    }

    // Verificar si el rol del usuario está permitido
    if (allowedRoles.includes(userRole)) {
      return true;
    }

    // Denegar acceso si el rol no está permitido
    return this.router.createUrlTree(['/unauthorized']);
  }
}
