import { Product, User, UserRole, Transaction, Supplier, StoreSettings } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Directeur',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/id/64/100/100',
  },
  {
    id: 'u2',
    name: 'Bob Vendeur',
    role: UserRole.CAISSE,
    avatar: 'https://picsum.photos/id/91/100/100',
  },
  {
    id: 'u3',
    name: 'Charlie Stock',
    role: UserRole.GESTOCK,
    avatar: 'https://picsum.photos/id/177/100/100',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's1',
    name: 'TechGlobal Inc.',
    contactName: 'John Smith',
    email: 'contact@techglobal.com',
    phone: '+1 555 0123'
  },
  {
    id: 's2',
    name: 'Office Comfort Ltd.',
    contactName: 'Sarah Connor',
    email: 'sales@officecomfort.com',
    phone: '+1 555 0987'
  },
  {
    id: 's3',
    name: 'Home Essentials',
    contactName: 'Mike Ross',
    email: 'mike@homeessentials.com',
    phone: '+1 555 4567'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Headphones',
    category: 'Electronics',
    price: 199.99,
    purchasePrice: 120.00,
    stock: 45,
    sku: 'EL-001',
    description: 'High fidelity noise cancelling headphones with 20h battery life.',
    imageUrl: 'https://picsum.photos/id/1/300/300',
    supplierId: 's1'
  },
  {
    id: 'p2',
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 49.99,
    purchasePrice: 25.00,
    stock: 120,
    sku: 'AC-002',
    description: 'Ergonomic wireless mouse.',
    imageUrl: 'https://picsum.photos/id/2/300/300',
    supplierId: 's1'
  },
  {
    id: 'p3',
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    price: 129.50,
    purchasePrice: 80.00,
    stock: 8,
    sku: 'EL-003',
    description: 'RGB mechanical keyboard with blue switches.',
    imageUrl: 'https://picsum.photos/id/3/300/300',
    supplierId: 's1'
  },
  {
    id: 'p4',
    name: 'Coffee Maker',
    category: 'Home',
    price: 89.99,
    purchasePrice: 55.00,
    stock: 15,
    sku: 'HM-004',
    description: 'Programmable coffee maker.',
    imageUrl: 'https://picsum.photos/id/4/300/300',
    supplierId: 's3'
  },
  {
    id: 'p5',
    name: 'Office Chair',
    category: 'Furniture',
    price: 250.00,
    purchasePrice: 150.00,
    stock: 3,
    sku: 'FR-005',
    description: 'Ergonomic mesh office chair.',
    imageUrl: 'https://picsum.photos/id/5/300/300',
    supplierId: 's2'
  },
  {
    id: 'p6',
    name: 'Smartphone Stand',
    category: 'Accessories',
    price: 15.99,
    purchasePrice: 5.00,
    stock: 200,
    sku: 'AC-006',
    description: 'Aluminum phone stand.',
    imageUrl: 'https://picsum.photos/id/6/300/300',
    supplierId: 's1'
  },
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  name: 'GestPro Boutique',
  address: '123 Avenue de l\'Innovation',
  city: '75001 Paris, France',
  phone: '01 23 45 67 89',
  email: 'contact@gestpro-boutique.com',
  logoUrl: '',
  receiptFooter: 'Merci de votre visite ! À bientôt.'
};

// Generate some mock history
const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    transactions.push({
      id: `t-${i}`,
      date: date.toISOString(),
      cashierId: 'u2',
      items: [
        { ...INITIAL_PRODUCTS[0], quantity: 1 },
        { ...INITIAL_PRODUCTS[1], quantity: 2 }
      ],
      total: 299.97 + (Math.random() * 100),
    });
  }
  return transactions;
};

export const INITIAL_TRANSACTIONS: Transaction[] = generateMockTransactions();