import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ClientService } from '../../services/client.service';
import { User } from '../../models/user.model';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {
  user: User = {
    id: '', // Inicializar id vacío
    name: '',
    email: '',
    password: '',
    role: '',
    assigned_region: '',
    clientId: '', // Inicializar clientId vacío
  };
  userId: string | null = '';
  clients: Client[] = []; // Lista de clientes para el desplegable

  constructor(
    private userService: UserService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el ID del usuario desde la URL
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserData(this.userId);
    }
    // Cargar la lista de clientes
    this.loadClients();
  }

  // Cargar los datos del usuario
  loadUserData(id: string): void {
    this.userService.getUserById(id).subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (err) => {
        console.error('Error al cargar el usuario:', err);
      },
    });
  }

  // Cargar los clientes
  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data; // Asignar la lista de clientes
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
      },
    });
  }

  // Enviar los datos editados
  updateUser(): void {
    this.userService.updateUser(this.userId!, this.user).subscribe({
      next: () => {
        alert('Usuario actualizado con éxito');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error al actualizar el usuario', err);
        alert('Error al actualizar el usuario');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
