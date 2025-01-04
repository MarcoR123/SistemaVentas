import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent {
  client = {
    nombre: '',
    categoria: '',
  };

  constructor(private clientService: ClientService, private router: Router) {}

  createClient(): void {
    const formData = new FormData();
    formData.append('nombre', this.client.nombre);
    formData.append('categoria', this.client.categoria);

    this.clientService.createClient(formData).subscribe({
      next: () => {
        alert('Cliente creado exitosamente.');
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        console.error('Error al crear el cliente:', err);
        alert('Error al crear el cliente.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
