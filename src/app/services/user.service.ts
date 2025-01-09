import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { from, map, mergeMap, toArray, switchMap } from 'rxjs';
import { SaleService } from './sale.service';
import { catchError } from 'rxjs/operators';



@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://authmicroservices2024.azurewebsites.net/api/Users';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients'; 
  private salesUrl = 'https://salesmicroservices2024.azurewebsites.net/api/Sales';

  constructor(private http: HttpClient, private saleService : SaleService ) {}

  getUsers(): Observable<User[]> {
      return this.http.get<User[]>(`${this.apiUrl}`).pipe(
        mergeMap((users) => {
          return from(users).pipe(
            mergeMap((user) =>
              this.http.get<any>(`${this.clientsUrl}/${user.clientId}`).pipe(
                map((client) => {
                  user.clientName = client.nombre; // Agregar el nombre del cliente
                  user.clientCategory = client.categoria; // Agregar la categoría del cliente
                  return user;
                })
              )
            ),
            toArray()
          );
        })
      );
    }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: FormData): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: string, user: User): Observable<void> {
    const formData = new FormData();
    formData.append('name', user.name);
    formData.append('email', user.email);
    formData.append('password', user.password || '');
    formData.append('role', user.role);
    formData.append('assigned_region', user.assigned_region);
    formData.append('clientId', user.clientId);

    return this.http.patch<void>(`${this.apiUrl}/${id}`, formData);
  }

  deleteUser(id: string): Observable<void> {
    return this.saleService.getSalesByUserId(id).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]); // Retorna una lista vacía si no se encuentran ventas
        }
        throw error; // Lanza otros errores que no sean 404
      }),
      map((sales) => {
        if (sales.length > 0) {
          throw new Error('No se puede eliminar el usuario. Existen ventas asociadas.');
        }
        return;
      }),
      switchMap(() => this.http.delete<void>(`${this.apiUrl}/${id}`))
    );
  }
  
  

  getUsersByClientId(clientId: string): Observable<User[]> {
      return this.http.get<User[]>(`${this.apiUrl}/GetUsersByClientId/${clientId}`).pipe(
        mergeMap((users) => {
          return from(users).pipe(
            mergeMap((user) =>
              this.http.get<any>(`${this.clientsUrl}/${user.clientId}`).pipe(
                map((client) => {
                  user.clientName = client.nombre;
                  user.clientCategory = client.categoria;
                  return user;
                })
              )
            ),
            toArray()
          );
        })
      );
    }
}
