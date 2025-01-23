import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    standalone: false,
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];  // Lista de usuarios
  errorMessage: string | null = null;

  isModalVisible: boolean = false; // Controla la visibilidad del modal de mensaje
  modalType: 'success' | 'error' = 'success'; // Tipo del modal
  message: string = ''; // Mensaje del modal

  isConfirmVisible: boolean = false; // Controla la visibilidad del modal de confirmación
  userToDelete: string | null = null; // ID del usuario a eliminar

  constructor(private userService: UserService, private authService: AuthService , private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        const role = localStorage.getItem('role');
        const clientId = localStorage.getItem('clientId');
        if (role === 'Supervisor') {
          // Filtrar usuarios por cliente del supervisor
          this.users = data.filter((user) => user.clientId === clientId);
        } else if (role === 'Administrador') {
          this.users = data; // Admin ve todos los usuarios
        } else {
          this.users = []; // Vendedor no tiene acceso
        }
      },
      error: (err) => {
        console.error('Error al cargar los usuarios:', err);
        this.errorMessage = 'Hubo un error al cargar los usuarios.';
      },
    });
  }
  

   createUser(): void {
    this.router.navigate(['/users/create']);
  }

  editUser(id: string): void {
    this.router.navigate([`/users/edit/${id}`]);
  }

  showConfirm(userId: string): void {
    this.userToDelete = userId;
    this.isConfirmVisible = true;
  }

  confirmDelete(): void {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete).subscribe({
        next: () => {
          this.users = this.users.filter((user) => user.id !== this.userToDelete);
          this.showModal('Usuario eliminado exitosamente.', 'success');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error al eliminar el usuario:', err);
          this.showModal('Error al eliminar el usuario. Intente nuevamente.', 'error');
        },
      });
      this.isConfirmVisible = false;
      this.userToDelete = null;
    }
  }

  cancelDelete(): void {
    this.isConfirmVisible = false;
    this.userToDelete = null;
  }

  // Mostrar modal de mensaje
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