import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerSupport } from '../models/customer-support.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerSupportService {
  private apiUrl = 'https://customersupportmicroservices2024.azurewebsites.net/api/CustomerSupport'; // Cambia por tu URL

  constructor(private http: HttpClient) {}

  // Obtener todos los reportes de soporte al cliente
  getAllCustomerSupport(): Observable<CustomerSupport[]> {
    return this.http.get<CustomerSupport[]>(`${this.apiUrl}`);
  }

  // Obtener reporte por ID
  getCustomerSupportById(id: string): Observable<CustomerSupport> {
    return this.http.get<CustomerSupport>(`${this.apiUrl}/${id}`);
  }

  // Obtener reportes por ClientId
  getCustomerSupportByClientId(clientId: string): Observable<CustomerSupport[]> {
    return this.http.get<CustomerSupport[]>(`${this.apiUrl}/client/${clientId}`);
  }

  // Obtener reportes por ProductId
  getCustomerSupportByProductId(productId: string): Observable<CustomerSupport[]> {
    return this.http.get<CustomerSupport[]>(`${this.apiUrl}/product/${productId}`);
  }

  // Crear un nuevo reporte
  createCustomerSupport(customerSupport: CustomerSupport): Observable<CustomerSupport> {
    return this.http.post<CustomerSupport>(`${this.apiUrl}`, customerSupport);
  }

  // Actualizar un reporte
  updateCustomerSupport(id: string, customerSupport: CustomerSupport): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, customerSupport);
  }

  // Eliminar un reporte
  deleteCustomerSupport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
