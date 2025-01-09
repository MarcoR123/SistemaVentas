import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, from, of } from 'rxjs';
import { tap, switchMap, map, mergeMap, toArray } from 'rxjs/operators';
import { Sale } from '../models/sale.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private salesUrl = 'https://salesmicroservices2024.azurewebsites.net/api/Sales';
  private productsUrl = 'https://productmicroservices.azurewebsites.net/api/Products';
  private usersUrl = 'https://authmicroservices2024.azurewebsites.net/api/Users';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Obtener todas las ventas o por clientId según el rol
  getSales(): Observable<Sale[]> {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const clientId = this.authService.getClientId(); // Obtener clientId
    const role = this.authService.getRole(); // Obtener el rol del usuario

    // Si el rol es "Administrador", obtener todas las ventas sin filtro
    if (role === 'Administrador') {
      return this.http.get<Sale[]>(`${this.salesUrl}`, { headers }).pipe(
        tap((response) => console.log("Ventas para Administrador:", response)),
        switchMap(sales => this.addDetailsToSales(sales))
      );
    }

    // Si no es administrador, filtrar por clientId
    return this.http.get<Sale[]>(`${this.salesUrl}/client/${clientId}`, { headers }).pipe(
      tap((response) => console.log(`Ventas para cliente ${clientId}:`, response)),
      switchMap(sales => this.addDetailsToSales(sales))
    );
  }

  private addDetailsToSales(sales: Sale[]): Observable<Sale[]> {
    return from(sales).pipe(
      mergeMap((sale) =>
        forkJoin({
          productDetails: sale.products[0]?.product_id
            ? this.http.get<any>(`${this.productsUrl}/GetProductById/${sale.products[0].product_id}`)
            : of(null),
          userDetails: this.http.get<any>(`${this.usersUrl}/${sale.user_id}`),
        }).pipe(
          switchMap(({ productDetails, userDetails }) => {
            if (productDetails?.clientId) {
              return this.http.get<any>(`${this.clientsUrl}/${productDetails.clientId}`).pipe(
                map((clientDetails) => ({
                  productDetails,
                  userDetails,
                  clientDetails,
                }))
              );
            } else {
              return of({
                productDetails,
                userDetails,
                clientDetails: null,
              });
            }
          }),
          map(({ productDetails, userDetails, clientDetails }) => {
            sale.products[0].product_name = productDetails?.name || 'Producto Desconocido';
            sale.products[0].product_image = productDetails?.image || 'assets/default-image.jpg';
            sale.user_name = userDetails?.name || 'Usuario Desconocido';
            sale.products[0].client_name = clientDetails?.nombre || 'Cliente Desconocido';
            sale.products[0].client_category = clientDetails?.categoria || 'Categoría No Definida';
            sale.total_price = sale.products.reduce((total, p) => total + p.price * p.quantity, 0);
            return sale;
          })
        )
      ),
      toArray()
    );
  }

  getSaleById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.salesUrl}/${id}`);
  }

  createSale(newSale: any): Observable<any> {
    const formData = new FormData();
    formData.append('product_id', newSale.product_id || '');
    formData.append('quantity', newSale.quantity?.toString() || '');
    formData.append('user_id', newSale.user_id || '');
    formData.append('status', newSale.status || '');
    formData.append('latitude', newSale.latitude?.toString() || '');
    formData.append('longitude', newSale.longitude?.toString() || '');
    formData.append('attachments', newSale.attachments || '');
    formData.append('clientId', newSale.clientId || '');
    return this.http.post(`${this.salesUrl}`, formData);
  }

  updateSale(id: string, updatedSale: any): Observable<void> {
    const formData = new FormData();
    formData.append('product_id', updatedSale.product_id);
    formData.append('quantity', updatedSale.quantity.toString());
    formData.append('status', updatedSale.status);
    formData.append('clientId', updatedSale.clientId || '');
    return this.http.patch<void>(`${this.salesUrl}/${id}`, formData);
  }

  deleteSale(id: string): Observable<void> {
    return this.http.delete<void>(`${this.salesUrl}/${id}`);
  }

  getSalesByClientId(clientId: string): Observable<Sale[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  
    return this.http.get<Sale[]>(`${this.salesUrl}/client/${clientId}`, { headers }).pipe(
      tap((response) => console.log(`Ventas para el clientId ${clientId}:`, response)),
      switchMap(sales => this.addDetailsToSales(sales))
    );
  }
  
}
