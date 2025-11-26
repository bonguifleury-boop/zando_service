export enum UserRole {
  ADMIN = 'ADMIN',
  CAISSE = 'CAISSE',
  GESTOCK = 'GESTOCK',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Prix de vente (Selling Price)
  purchasePrice: number; // Prix d'achat (Buying Price)
  stock: number;
  sku: string;
  description?: string;
  imageUrl: string;
  supplierId?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  cashierId: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}

export interface StoreSettings {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logoUrl: string; // Base64 or URL
  receiptFooter: string;
}

export interface BackupData {
  version: string;
  date: string;
  storeSettings: StoreSettings;
  products: Product[];
  suppliers: Supplier[];
  transactions: Transaction[];
}