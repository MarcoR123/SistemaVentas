import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';

@Component({
    selector: 'app-client-form',
    templateUrl: './client-form.component.html',
    standalone: false,
    styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent {
  client = {
    nombre: '',
    categoria: '',
  };

  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal
  modalType: 'success' | 'error' = 'success'; // Tipo del modal (éxito o error)

  constructor(private clientService: ClientService, private router: Router) {}

  createClient(): void {
    const formData = new FormData();
    formData.append('nombre', this.client.nombre);
    formData.append('categoria', this.client.categoria);

    this.clientService.createClient(formData).subscribe({
      next: () => {
        this.showModal('Cliente creado exitosamente.', 'success');
        setTimeout(() => this.router.navigate(['/clients']), 2000); 
      },
      error: (err) => {
        console.error('Error al crear el cliente:', err);
        this.showModal(
          'Error al crear el cliente. Por favor, intente nuevamente.',
          'error'
        );
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
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