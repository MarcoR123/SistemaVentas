import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-sale-list',
  templateUrl: './sale-list.component.html',
})
export class SaleListComponent implements OnInit {
  sales: any[] = [];

  constructor(private saleService: SaleService, private router: Router) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.saleService.getSales().subscribe({
      next: (data) => (this.sales = data),
      error: (err) => console.error('Error al cargar las ventas:', err),
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
          alert('Venta eliminada con éxito.');
          this.loadSales();
        },
        error: (err) => console.error('Error al eliminar la venta:', err),
      });
    }
  }
}
