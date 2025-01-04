export interface SaleProduct {
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;  
  clientId?: string;
  client_name?: string;
  client_category?: string;
  product_image ?: string;
}

export interface ClientDetails {
  nombre: string;
  categoria: string;
}

export interface Sale {
  id: string;
  products: SaleProduct[];
  total_price: number;
  user_id: string;
  user_name?: string;  
  status: string;
  geolocation?: { latitude: string; longitude: string };
  attachments?: string;

}
