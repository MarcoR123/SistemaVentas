import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
    selector: 'app-client-edit',
    templateUrl: './client-edit.component.html',
    standalone: false
})
export class ClientEditComponent implements OnInit {
  client: Client = {
    id: '',
    nombre: '',
    categoria: '',
  };

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
        alert('Cliente actualizado exitosamente.');
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        console.error('Error al actualizar el cliente:', err);
        alert('Error al actualizar el cliente.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
