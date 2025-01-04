import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  user: User = {
    id: '', // Inicializar id vacío
    name: '',
    email: '',
    password: '',
    role: '',
    assigned_region: '',
    clientId: '', // Inicializar clientId vacío
  };

  clients: Client[] = []; // Lista de clientes para el desplegable

  constructor(
    private userService: UserService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients(); // Cargar clientes al inicializar el componente
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data; // Guardar la lista de clientes
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
      },
    });
  }

  createUser(): void {
    const formData = new FormData();
    formData.append('name', this.user.name);
    formData.append('email', this.user.email);
    formData.append('role', this.user.role);
    formData.append('assigned_region', this.user.assigned_region);
    formData.append('password', this.user.password);
    formData.append('clientId', this.user.clientId);

    this.userService.createUser(formData).subscribe({
      next: () => {
        alert('Usuario creado con éxito');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error al crear el usuario', err);
        alert('Error al crear el usuario');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
