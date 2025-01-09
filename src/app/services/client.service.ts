import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map, of, throwError} from 'rxjs';
import { Client } from '../models/client.model';
import { SaleService } from './sale.service';
import { ProductService } from './product.service';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';



@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients';
  private salesUrl = 'https://salesmicroservices2024.azurewebsites.net/api/Sales';
  private productsUrl = 'https://productmicroservices.azurewebsites.net/api/Products';

  constructor(private http: HttpClient, private saleService:SaleService, private productService : ProductService ) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(client: FormData): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  updateClient(id: string, client: FormData): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: string): Observable<void> {
    return forkJoin({
      sales: this.saleService.getSalesByClientId(id).pipe(
        catchError((error) => (error.status === 404 ? of([]) : throwError(() => error)))
      ),
      products: this.productService.getProductsByClientId(id).pipe(
        catchError((error) => (error.status === 404 ? of([]) : throwError(() => error)))
      ),
    }).pipe(
      map(({ sales, products }) => {
        if (sales.length > 0 || products.length > 0) {
          throw new Error('No se puede eliminar el cliente. Existen productos o ventas asociadas.');
        }
        return;
      }),
      switchMap(() => this.http.delete<void>(`${this.apiUrl}/${id}`))
    );
  }
  
  
}
