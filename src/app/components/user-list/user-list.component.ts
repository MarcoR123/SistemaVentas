import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    standalone: false
})
export class UserListComponent implements OnInit {
  users: any[] = [];  // Lista de usuarios
  errorMessage: string | null = null;

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

  deleteUser(id: string): void {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          // Remover el usuario de la lista sin necesidad de recargar
          this.users = this.users.filter(user => user.id !== id);
          alert("Usuario eliminado exitosamente");
        },
        error: (error) => {
          alert(error.message);
          console.warn("Error al eliminar el usuario:", error);
          alert("Error al eliminar el usuario");
        }
      });
    }
  }
}
