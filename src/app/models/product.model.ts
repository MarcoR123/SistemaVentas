export interface Product {
    id?: string; // Opcional ya que no es necesario cuando creo un nuevo producto
    name: string;
    description: string;
    price: number;
    image?: string; // URL de la imagen
    clientId: string;
    clientName?: string; // Nombre del cliente asociado
  clientCategory?: string; // Categoría del cliente asociado
  }
  