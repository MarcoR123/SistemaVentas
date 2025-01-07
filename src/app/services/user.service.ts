import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { from, map, mergeMap, toArray } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://authmicroservices2024.azurewebsites.net/api/Users';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients'; 

  constructor(private http: HttpClient) {}

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
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
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
