import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { Client } from '../../models/client.model';

@Component({
    selector: 'app-client-list',
    templateUrl: './client-list.component.html',
    standalone: false
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  errorMessage: string | null = null;

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

  deleteClient(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.clients = this.clients.filter((client) => client.id !== id);
          alert('Cliente eliminado exitosamente.');
        },
        error: (err) => {
          console.error('Error al eliminar el cliente:', err);
          alert('Error al eliminar el cliente.');
        },
      });
    }
  }
}
