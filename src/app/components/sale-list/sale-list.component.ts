import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SaleService } from '../../services/sale.service';

@Component({
    selector: 'app-sale-list',
    templateUrl: './sale-list.component.html',
    standalone: false
})
export class SaleListComponent implements OnInit {
  sales: any[] = [];
  errorMessage: string | null = null;

  constructor(private saleService: SaleService, private router: Router) {}

  ngOnInit(): void {
    this.loadSales(); // Llama al método general que verifica el rol
  }

  loadSales(): void {
    this.saleService.getSales().subscribe({
      next: (data) => {
        this.sales = data;
        this.errorMessage = null;
      },
      error: (err) => {
        console.error('Error al cargar las ventas:', err);
        this.errorMessage = 'Hubo un error al cargar las ventas.';
      }
    });
  }

  createSale(): void {
    this.router.navigate(['/sales/create']);
  }

  editSale(id: string): void {
    this.router.navigate(['/sales/edit', id]);
  }

  deleteSale(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      this.saleService.deleteSale(id).subscribe({
        next: () => {
          this.sales = this.sales.filter(sale => sale.id !== id);
          alert('Venta eliminada con éxito.');
        },
        error: (err) => console.error('Error al eliminar la venta:', err),
      });
    }
  }
}
