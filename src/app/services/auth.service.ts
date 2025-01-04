import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://authmicroservices2024.azurewebsites.net/api/Auth'; 


  constructor(private http: HttpClient, private router: Router) {}

  login(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, formData);
  }
  
  logout(): void {
    localStorage.clear(); // Limpia todo el localStorage
    this.router.navigate(['/login']); // Redirige al login
  }
  
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');

  }

  getRole(): string | null {
    return localStorage.getItem('role'); // Retorna el rol almacenado en localStorage
  }
  
  hasRole(role: string): boolean {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.role === role;
  }  

  hasClientId(clientId: string): boolean {
    return localStorage.getItem('clientId') === clientId;
  }
}