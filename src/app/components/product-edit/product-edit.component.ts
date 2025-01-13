import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';


@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html',
    standalone: false
})
export class ProductEditComponent implements OnInit {
  product: Product = {
    name: '',
    description: '',
    price: 0,
    image: '',  // Asegúrate de que la propiedad de la imagen esté presente
    clientId: '', // Asegúrate de que la propiedad clientId
  };
  productId: string | null = null;
  clients: Client[] = []; // Lista de clientes


  constructor(
    private productService: ProductService,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtén el ID del producto de la URL
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      // Si el ID está presente, obtén los datos del producto
      this.productService.getProductById(this.productId).subscribe({
        next: (data) => {
          this.product = data; // Asigna el producto al objeto
        },
        error: (err) => console.error('Error al cargar el producto:', err),
      });
    }
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (err) => console.error('Error al cargar los clientes:', err),
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.product.image = reader.result as string;  // Convertimos la imagen a base64
      };
      reader.readAsDataURL(file);
    }
  }
  

  // Método para actualizar el producto
  updateProduct(): void {
    const formData = new FormData();
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);
    formData.append('price', this.product.price.toString());
    formData.append('clientId', this.product.clientId); 
    if (this.product.image) {
      formData.append('image', this.product.image); // Imagen en base64
    }

    this.productService.updateProduct(this.productId!, formData).subscribe({
      next: () => {
        alert('Producto actualizado con éxito');
        this.router.navigate(['/products']);
      },
      error: (err) => console.error('Error al actualizar el producto:', err),
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
