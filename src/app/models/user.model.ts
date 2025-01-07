// user.model.ts
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    assigned_region: string;
    password: string;
    clientId: string;
    clientName?: string; // Nombre del cliente asociado
  clientCategory?: string; // Categoría del cliente asociado
  }
  