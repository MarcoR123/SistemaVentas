import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';


@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css'],
    standalone: false
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  errorMessage: string | null = null;


  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal de notificación
  modalType: 'success' | 'error' = 'success'; // Tipo del modal de notificación

  isConfirmVisible: boolean = false; // Controla la visibilidad del modal de confirmación
  productToDelete: string | null = null; // ID del producto a eliminar

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts(); // Llama directamente al método que valida el rol
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.errorMessage = null; // Limpiar cualquier mensaje de error si la carga es exitosa
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'Hubo un error al cargar los productos.';
      }
    });
  }

  editProduct(id?: string): void {
    if (id) {
      this.router.navigate(['/products/edit', id]);
    }
  }

  showConfirm(productId: string): void {
    if (productId) {
      this.productToDelete = productId;
      this.isConfirmVisible = true;
    }
  }
  

  confirmDelete(): void {
    if (this.productToDelete) {
      this.productService.deleteProduct(this.productToDelete).subscribe({
        next: () => {
          this.products = this.products.filter(
            (product) => product.id !== this.productToDelete
          );
          this.showModal('Producto eliminado exitosamente.', 'success');
          this.isConfirmVisible = false;
          this.productToDelete = null;
        },
        error: (error) => {
          console.error('Error al eliminar el producto:', error);
          this.showModal('Error al eliminar el producto. Intente nuevamente.', 'error');
          this.isConfirmVisible = false;
          this.productToDelete = null;
        },
      });
    }
  }

  cancelDelete(): void {
    this.isConfirmVisible = false;
    this.productToDelete = null;
  }

  showModal(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.modalType = type;
    this.isModalVisible = true;

    setTimeout(() => {
      this.isModalVisible = false;
    }, 2000);
  }
}
