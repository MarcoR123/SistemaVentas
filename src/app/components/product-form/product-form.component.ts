import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ClientService } from '../../services/client.service'; // Nuevo servicio para clientes
import { Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { Client } from '../../models/client.model'; // Modelo para clientes
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';  // Para generar nombres únicos
import { getApps, initializeApp } from '@angular/fire/app';


@Component({
    selector: 'app-product-form',
    templateUrl: './product-form.component.html',
    standalone: false
})
export class ProductFormComponent implements OnInit {
  product: Product = {
    name: '',
    description: '',
    price: 0,
    image: '',
    clientId: ''
  };

  clients: Client[] = []; // Lista de clientes
  selectedClient: string = ''; // Cliente seleccionado

  constructor(
    private productService: ProductService,
    private clientService: ClientService, // Inyectar el servicio de clientes
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!getApps().length) {
      initializeApp(environment.firebaseConfig);
    }
    // Cargar la lista de clientes al inicializar el componente
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (err) => console.error('Error al cargar clientes:', err),
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
  

  createProduct(): void {
    const formData = new FormData();
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);
    formData.append('price', this.product.price.toString());
    formData.append('clientId', this.selectedClient); // Asignar el ID del cliente seleccionado
    if (this.product.image) {
      formData.append('image', this.product.image);
    }

    this.productService.createProduct(formData).subscribe(
      () => {
        this.router.navigate(['/products']);
      },
      (error) => console.error('Error al crear el producto:', error)
    );
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
