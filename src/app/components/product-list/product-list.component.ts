import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  errorMessage: string | null = null;

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

  deleteProduct(id: string): void {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== id);
          alert("Producto eliminado exitosamente");
        },
        error: (error) => {
          console.warn("Error al eliminar el producto:", error);
          this.products = this.products.filter(product => product.id !== id);
        }
      });
    }
  }
}
