import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, mergeMap, Observable, toArray } from 'rxjs';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'https://productmicroservices.azurewebsites.net/api/Products';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients'; 
  


  constructor(private http: HttpClient, private authService : AuthService) {}

  // Obtener todos los productos o filtrados por cliente
  getProducts(): Observable<Product[]> {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  
    const clientId = this.authService.getClientId();
    const role = this.authService.getRole();
  
    if (role === 'Administrador') {
      return this.http.get<Product[]>(`${this.apiUrl}`, { headers }).pipe(
        mergeMap((products) => {
          return from(products).pipe(
            mergeMap((product) =>
              this.http.get<any>(`${this.clientsUrl}/${product.clientId}`, { headers }).pipe(
                map((client) => {
                  product.clientName = client.nombre;
                  product.clientCategory = client.categoria;
                  return product;
                })
              )
            ),
            toArray()
          );
        })
      );
    }
  
    return this.http.get<Product[]>(`${this.apiUrl}/GetProductsByClientId/${clientId}`, { headers }).pipe(
      mergeMap((products) => {
        return from(products).pipe(
          mergeMap((product) =>
            this.http.get<any>(`${this.clientsUrl}/${product.clientId}`, { headers }).pipe(
              map((client) => {
                product.clientName = client.nombre;
                product.clientCategory = client.categoria;
                return product;
              })
            )
          ),
          toArray()
        );
      })
    );
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/GetProductById/${id}`);
  }

  // Crear un producto
  createProduct(product: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // Actualizar un producto
  updateProduct(id: string, product: FormData): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, product);
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtener productos por cliente
  getProductsByClientId(clientId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/GetProductsByClientId/${clientId}`).pipe(
      mergeMap((products) => {
        return from(products).pipe(
          mergeMap((product) =>
            this.http.get<any>(`${this.clientsUrl}/${product.clientId}`).pipe(
              map((client) => {
                product.clientName = client.nombre;
                product.clientCategory = client.categoria;
                return product;
              })
            )
          ),
          toArray()
        );
      })
    );
  }
  
  
}
