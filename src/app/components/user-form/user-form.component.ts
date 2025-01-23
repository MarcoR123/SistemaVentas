import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
    selector: 'app-user-form',
    templateUrl: './user-form.component.html',
    standalone: false,
    styleUrls: ['./user-form.component.css']
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

  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal
  modalType: 'success' | 'error' = 'success'; // Tipo del modal (éxito o error)

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
        this.showModal('Usuario creado con éxito.', 'success');
        setTimeout(() => this.router.navigate(['/users']), 2000); // Redirige después de 3 segundos
      },
      error: (err) => {
        console.error('Error al crear el usuario', err);
        this.showModal('Error al crear el usuario. Por favor, intente nuevamente.', 'error');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }

  showModal(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.modalType = type;
    this.isModalVisible = true;

    // Oculta el modal automáticamente después de 3 segundos
    setTimeout(() => {
      this.isModalVisible = false;
    }, 3000);
  }
}
