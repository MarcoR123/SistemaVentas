import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, from, of } from 'rxjs';
import { tap, switchMap, map, mergeMap, toArray } from 'rxjs/operators';
import { Sale, SaleProduct } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private salesUrl = 'https://salesmicroservices2024.azurewebsites.net/api/Sales';
  private productsUrl = 'https://productmicroservices.azurewebsites.net/api/Products';
  private usersUrl = 'https://authmicroservices2024.azurewebsites.net/api/Users';
  private clientsUrl = 'https://clientmicroservice2024.azurewebsites.net/api/Clients';

  constructor(private http: HttpClient) {}

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.salesUrl).pipe(
      tap((response: any) => console.log("Response from API:", response)),
      
      switchMap(sales => this.addDetailsToSales(sales))
      
    );
    
  }

  getSalesByClientId(clientId: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.salesUrl}/client/${clientId}`).pipe(
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
                map((clientDetails) => {
                  console.log('Product Details:', productDetails); // Aquí se loguean los detalles del producto
                  console.log('Image URL:', productDetails?.image_url); // Aquí se loguea la URL de la imagen
                  return {
                    productDetails,
                    userDetails,
                    clientDetails,
                  };
                })
              );
            } else {
              console.log('Product Details:', productDetails); // Aquí se loguean los detalles del producto
              console.log('Image URL:', productDetails?.image_url); // Aquí se loguea la URL de la imagen
              return of({
                productDetails,
                userDetails,
                clientDetails: null,
              });
            }
          }),
          map(({ productDetails, userDetails, clientDetails }) => {
            // Asignar datos del producto
            sale.products[0].product_name = productDetails?.name || 'Producto Desconocido';

             sale.products[0].product_image = productDetails?.image
    ? productDetails.image // Usa directamente la imagen Base64 si está disponible
    : 'assets/default-image.jpg'; // Imagen por defecto si no existe

  
            // Asignar datos del usuario
            sale.user_name = userDetails?.name || 'Usuario Desconocido';
  
            // Asignar datos del cliente (si existen)
            if (clientDetails) {
              sale.products[0].client_name = clientDetails.nombre || 'Cliente Desconocido';
              sale.products[0].client_category = clientDetails.categoria || 'Categoría No Definida';
            } else {
              sale.products[0].client_name = 'N/A';
              sale.products[0].client_category = 'N/A';
            }
  
            // Calcular el precio total
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

    if (newSale.product_id) {
      formData.append('product_id', newSale.product_id);
    }

    if (newSale.quantity !== undefined && newSale.quantity !== null) {
      formData.append('quantity', newSale.quantity.toString());
    }

    if (newSale.user_id) {
      formData.append('user_id', newSale.user_id);
    }

    if (newSale.status) {
      formData.append('status', newSale.status);
    }

    if (newSale.latitude !== undefined) {
      formData.append('latitude', newSale.latitude.toString());
    }

    if (newSale.longitude !== undefined) {
      formData.append('longitude', newSale.longitude.toString());
    }

    if (newSale.attachments) {
      formData.append('attachments', newSale.attachments);
    }

    if (newSale.clientId) {
      formData.append('clientId', newSale.clientId);
    }

    return this.http.post(`${this.salesUrl}`, formData);
  }

  updateSale(id: string, updatedSale: any): Observable<void> {
    const formData = new FormData();
    formData.append('product_id', updatedSale.product_id);
    formData.append('quantity', updatedSale.quantity.toString());
    formData.append('status', updatedSale.status);

    if (updatedSale.clientId) {
      formData.append('clientId', updatedSale.clientId);
    }

    return this.http.patch<void>(`${this.salesUrl}/${id}`, formData);
  }

  deleteSale(id: string): Observable<void> {
    return this.http.delete<void>(`${this.salesUrl}/${id}`);
  }
}
