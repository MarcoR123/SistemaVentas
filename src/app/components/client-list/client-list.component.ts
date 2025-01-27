import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { Client } from '../../models/client.model';

@Component({
    selector: 'app-client-list',
    templateUrl: './client-list.component.html',
    standalone: false,
    styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  errorMessage: string | null = null;

  private colorPalette: string[] = [
    '#007BFF', // Azul fuerte
    '#28A745', // Verde
    '#FFC107', // Amarillo
    '#DC3545', // Rojo
    '#6C757D', // Gris
    '#FF5733', // Naranja suave
    '#6610F2', // Morado
    '#FD7E14'  // Naranja fuerte
  ];

  private predefinedCategories: string[] = [
    'Internet',
    'Electrodomesticos',
    'Laptops',
    'Farmacia',
    'Administrador'
  ];

  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal
  modalType: 'success' | 'error' = 'success'; // Tipo del modal (éxito o error)
  isConfirmVisible: boolean = false; // Controla la visibilidad del modal de confirmación
  clientToDelete: string | null = null; // ID del cliente a eliminar

  constructor(private clientService: ClientService, private router: Router) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
        this.errorMessage = 'Error al cargar los clientes.';
      },
    });
  }

  createClient(): void {
    this.router.navigate(['/clients/create']);
  }

  editClient(id: string): void {
    this.router.navigate([`/clients/edit/${id}`]);
  }

  showConfirm(clientId: string): void {
    this.clientToDelete = clientId;
    this.isConfirmVisible = true;
  }

  confirmDelete(): void {
    if (this.clientToDelete) {
      this.clientService.deleteClient(this.clientToDelete).subscribe({
        next: () => {
          this.clients = this.clients.filter(
            (client) => client.id !== this.clientToDelete
          );
          this.showModal('Cliente eliminado exitosamente.', 'success');
          this.loadClients(); 
        },
        error: (err) => {
          console.error('Error al eliminar el cliente:', err);
          this.showModal(
            'Error al eliminar el cliente. Por favor, intente nuevamente.',
            'error'
          );
        },
      });
      this.isConfirmVisible = false;
      this.clientToDelete = null;
    }
  }

  cancelDelete(): void {
    this.isConfirmVisible = false;
    this.clientToDelete = null;
  }

  isNewCategory(categoria: string): boolean {
    return !this.predefinedCategories.includes(categoria);
  }

  generateColorFromPalette(categoria: string): string {
    if (!categoria) return '#6C757D'; // Gris para categorías sin nombre
    const index = categoria.length % this.colorPalette.length; // Determina el color basado en el nombre de la categoría
    return this.colorPalette[index];
  }
  

  // Muestra el modal con el mensaje y el tipo
  showModal(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.modalType = type;
    this.isModalVisible = true;

    // Ocultar modal automáticamente después de 3 segundos
    setTimeout(() => {
      this.isModalVisible = false;
    }, 3000);
  }
}