export interface CustomerSupport {
  id?: string;               // ID opcional
  product_id?: string;        // ID del producto
  clientId?: string;          // ID del cliente
  user_id?: string;           // ID del usuario
  training?: boolean;         // ¿Requiere capacitación?
  complaint?: boolean;        // ¿Es una queja?
  comments?: string;          // Comentarios adicionales
  geolocation?: {
    latitude?: number;        // Latitud
    longitude?: number;       // Longitud
  };
  attachments?: string;       // URL o Base64 del adjunto
  date?: Date;                // Fecha
}
