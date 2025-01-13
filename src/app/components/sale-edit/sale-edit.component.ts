import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleService } from '../../services/sale.service';

@Component({
    selector: 'app-sale-edit',
    templateUrl: './sale-edit.component.html',
    standalone: false
})
export class SaleEditComponent implements OnInit {
  sale: any = { products: [{ product_id: '', quantity: 0 }], status: '' };

  constructor(
    private saleService: SaleService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const saleId = this.route.snapshot.paramMap.get('id');
    if (saleId) {
      this.saleService.getSaleById(saleId).subscribe({
        next: (data) => {
          this.sale = data; // Cargar los datos de la venta en el formulario
        },
        error: (err) => {
          console.error('Error al cargar la venta:', err);
          alert('No se pudo cargar la información de la venta.');
        },
      });
    }
  }

  onSubmit(): void {
    const updatedSale = {
      product_id: this.sale.products[0].product_id,
      quantity: this.sale.products[0].quantity,
      status: this.sale.status,
    };
  
    this.saleService.updateSale(this.sale.id, updatedSale).subscribe({
      next: () => {
        alert('Venta actualizada con éxito.');
        this.router.navigate(['/sales']);
      },
      error: (err) => {
        console.error('Error al actualizar la venta:', err);
        alert('Error al actualizar la venta.');
      },
    });
  }
  

  onCancel(): void {
    this.router.navigate(['/sales']);
  }
}
