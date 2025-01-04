import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-sale-form',
  templateUrl: './sale-form.component.html',
})

export class SaleFormComponent implements OnInit {
  sale: any = {
    product_id: '',   
    quantity: 0,     
    user_id: '',     
    status: 'Incomplete',
    latitude: 0,     // Valor predeterminado para latitud
    longitude: 0,    // Valor predeterminado para longitud
  };

  products: any[] = [];  // Lista de productos disponibles
  users: any[] = [];     // Lista de usuarios disponibles

  constructor(
    private saleService: SaleService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => console.error('Error al cargar los productos:', err),
    });
  }

  onSubmit(): void {
    console.log(this.sale); // Revisemos los datos que se están enviando
    this.saleService.createSale(this.sale).subscribe({
      next: () => {
        alert('Venta creada con éxito.');
        this.router.navigate(['/sales']);
      },
      error: (err) => {
        console.error('Error al crear la venta:', err);
        console.log(this.sale);  // Verifica los valores de 'sale' antes de enviarlo
        alert('Error al crear la venta.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/sales']);
  }
}

