import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-edit',
  templateUrl: './client-edit.component.html',
  standalone: false,
  styleUrls: ['./client-edit.component.css'],
})
export class ClientEditComponent implements OnInit {
  client: Client = {
    id: '',
    nombre: '',
    categoria: '',
  };

  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal
  modalType: 'success' | 'error' = 'success'; // Tipo del modal (éxito o error)

  constructor(
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientService.getClientById(id).subscribe((data) => {
        this.client = data;
      });
    }
  }

  updateClient(): void {
    const formData = new FormData();
    formData.append('nombre', this.client.nombre);
    formData.append('categoria', this.client.categoria);

    this.clientService.updateClient(this.client.id, formData).subscribe({
      next: () => {
        this.showModal('Cliente actualizado exitosamente.', 'success');
        setTimeout(() => this.router.navigate(['/clients']), 1000); // Redirigir
      },
      error: () => {
        this.showModal(
          'Error al actualizar el cliente. Por favor, intente nuevamente.',
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
    }, 2000);
  }
}
