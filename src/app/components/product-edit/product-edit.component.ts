import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';  // Para generar nombres únicos
import { getApps, initializeApp } from '@angular/fire/app';


@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html',
    styleUrls: ['./product-edit.component.css'],
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

  message: string = ''; // Mensaje del modal
  isModalVisible: boolean = false; // Controla la visibilidad del modal
  modalType: 'success' | 'error' = 'success'; // Tipo del modal (éxito o error)

  constructor(
    private productService: ProductService,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!getApps().length) {
      initializeApp(environment.firebaseConfig);
    }
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
          const storage = getStorage(); // Esto toma la instancia predeterminada ya inicializada
          const storageRef = ref(storage, `products/${uuidv4()}.${file.name.split('.').pop()}`);  // Nombre único con extensión
      
          uploadBytes(storageRef, file).then((snapshot) => {
            console.log('Imagen subida con éxito');
            // Obtener la URL de descarga
            getDownloadURL(snapshot.ref).then((url) => {
              this.product.image = url;  // Guardamos la URL en el producto
              console.log('URL de la imagen:', url);
            });
          }).catch((error) => {
            console.error('Error al subir la imagen:', error);
          });
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
        this.showModal('Producto actualizado con éxito', 'success');
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 3000); // Redirigir después de 3 segundos
      },
      error: (err) => {
        console.error('Error al actualizar el producto:', err);
        this.showModal(
          'Error al actualizar el producto. Por favor, intente nuevamente.',
          'error'
        );
      },
    });
  }


  cancel(): void {
    this.router.navigate(['/products']);
  }

   // Muestra el modal con el mensaje y el tipo
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
