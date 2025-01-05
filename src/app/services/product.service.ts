import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, mergeMap, Observable, toArray } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'https://productmicroservices.azurewebsites.net/api/Products';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients'; // URL correcta


  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}`).pipe(
      mergeMap((products) => {
        return from(products).pipe(
          mergeMap((product) =>
            this.http.get<any>(`${this.clientsUrl}/${product.clientId}`).pipe(
              map((client) => {
                product.clientName = client.nombre; // Agregar el nombre del cliente
                product.clientCategory = client.categoria; // Agregar la categoría del cliente
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
