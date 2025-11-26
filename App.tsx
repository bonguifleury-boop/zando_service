import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/admin/AdminDashboard';
import ReportDashboard from './components/admin/ReportDashboard';
import Settings from './components/admin/Settings';
import POSInterface from './components/pos/POSInterface';
import InventoryManager from './components/stock/InventoryManager';
import SupplierManager from './components/stock/SupplierManager';
import { User, Product, Transaction, CartItem, Supplier, StoreSettings, BackupData } from './types';
import { INITIAL_STORE_SETTINGS } from './constants';
import { supabase } from './services/supabaseClient';
import { Database, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState(false);

  // --- Mappers (DB <-> App) ---
  const mapProductFromDb = (row: any): Product => ({
    id: row.id,
    name: row.name,
    category: row.category || 'General',
    price: Number(row.price),
    purchasePrice: Number(row.purchase_price),
    stock: Number(row.stock),
    sku: row.sku,
    description: row.description || '',
    imageUrl: row.image_url || 'https://picsum.photos/300/300',
    supplierId: row.supplier_id
  });

  const mapProductToDb = (p: Partial<Product>) => ({
    name: p.name,
    category: p.category,
    price: p.price,
    purchase_price: p.purchasePrice,
    stock: p.stock,
    sku: p.sku,
    description: p.description,
    image_url: p.imageUrl,
    // Convert empty string to null to avoid UUID syntax error in Postgres
    supplier_id: p.supplierId === '' ? null : p.supplierId
  });

  const mapSupplierFromDb = (row: any): Supplier => ({
    id: row.id,
    name: row.name,
    contactName: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || ''
  });

  const mapSupplierToDb = (s: Partial<Supplier>) => ({
    name: s.name,
    contact_name: s.contactName,
    email: s.email,
    phone: s.phone
  });

  const mapTransactionFromDb = (row: any): Transaction => ({
    id: row.id,
    date: row.date,
    total: Number(row.total),
    cashierId: row.cashier_id,
    items: row.items as CartItem[]
  });

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    setMissingTables(false);

    try {
        // 1. Settings
        const { data: settingsData, error: settingsError } = await supabase.from('store_settings').select('*').single();
        
        // Specific check for missing table error
        if (settingsError) {
             if (settingsError.message.includes('Could not find the table') || settingsError.code === '42P01') {
                 throw new Error("MISSING_TABLES");
             }
             if (settingsError.code !== 'PGRST116') { // PGRST116 is just "no rows found", which is fine for first load
                 console.error('Settings Error:', settingsError);
             }
        }

        if (settingsData) {
            setStoreSettings({
                name: settingsData.name,
                address: settingsData.address,
                city: settingsData.city,
                phone: settingsData.phone,
                email: settingsData.email,
                logoUrl: settingsData.logo_url,
                receiptFooter: settingsData.receipt_footer
            });
        }

        // 2. Suppliers
        const { data: suppliersData, error: supplierError } = await supabase.from('suppliers').select('*');
        if (supplierError) {
            if (supplierError.message.includes('Could not find the table') || supplierError.code === '42P01') throw new Error("MISSING_TABLES");
            throw supplierError;
        }
        if (suppliersData) setSuppliers(suppliersData.map(mapSupplierFromDb));

        // 3. Products
        const { data: productsData, error: prodError } = await supabase.from('products').select('*');
        if (prodError) throw prodError;
        if (productsData) setProducts(productsData.map(mapProductFromDb));

        // 4. Transactions
        const { data: transactionsData, error: transError } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (transError) throw transError;
        if (transactionsData) setTransactions(transactionsData.map(mapTransactionFromDb));

    } catch (err: any) {
        console.error("Error fetching data:", err);
        
        if (err.message === "MISSING_TABLES") {
            setMissingTables(true);
            setError("Les tables de la base de données n'existent pas encore.");
        } else {
            let msg = "Impossible de charger les données.";
            if (err.message) msg += " " + err.message;
            if (err.code === '42501') msg += " (Erreur de Permission RLS: Vérifiez que RLS est désactivé ou configuré)";
            setError(msg);
        }
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && supabase) {
        fetchData();
    }
  }, [currentUser]);

  // Reset view on user change
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') setCurrentView('dashboard');
      if (currentUser.role === 'CAISSE') setCurrentView('pos');
      if (currentUser.role === 'GESTOCK') setCurrentView('inventory');
    }
  }, [currentUser]);

  // --- Handlers ---

  // Inventory
  const handleAddProduct = async (newProduct: Product): Promise<boolean> => {
    if (!supabase) return false;
    const dbPayload = mapProductToDb(newProduct);
    
    const { data, error } = await supabase.from('products').insert(dbPayload).select();
    if (error) {
        alert("Erreur ajout produit: " + error.message);
        return false;
    } else if (data) {
        setProducts(prev => [...prev, mapProductFromDb(data[0])]);
        return true;
    }
    return false;
  };

  const handleUpdateProduct = async (updatedProduct: Product): Promise<boolean> => {
    if (!supabase) return false;
    const dbPayload = mapProductToDb(updatedProduct);
    
    const { error } = await supabase.from('products').update(dbPayload).eq('id', updatedProduct.id);
    if (error) {
        alert("Erreur mise à jour: " + error.message);
        return false;
    } else {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        return true;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
        alert("Erreur suppression: " + error.message);
    } else {
        setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Suppliers
  const handleAddSupplier = async (newSupplier: Supplier): Promise<boolean> => {
      if (!supabase) return false;
      const dbPayload = mapSupplierToDb(newSupplier);
      
      const { data, error } = await supabase.from('suppliers').insert(dbPayload).select();
      if (error) {
          console.error('Supabase Insert Error:', error);
          let msg = error.message;
          if (error.code === '42501') msg += " (Permission refusée / RLS activé)";
          alert("Erreur ajout fournisseur: " + msg);
          return false;
      } else if (data) {
          setSuppliers(prev => [...prev, mapSupplierFromDb(data[0])]);
          return true;
      }
      return false;
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier): Promise<boolean> => {
      if (!supabase) return false;
      const dbPayload = mapSupplierToDb(updatedSupplier);
      
      const { error } = await supabase.from('suppliers').update(dbPayload).eq('id', updatedSupplier.id);
      if (error) {
          alert("Erreur mise à jour fournisseur: " + error.message);
          return false;
      } else {
          setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
          return true;
      }
  };

  const handleDeleteSupplier = async (id: string): Promise<boolean> => {
      if (!supabase) return false;
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) {
          alert("Erreur suppression fournisseur: " + error.message);
          return false;
      } else {
          setSuppliers(prev => prev.filter(s => s.id !== id));
          return true;
      }
  };

  // Settings
  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    if (!supabase) return;
    const dbPayload = {
        name: newSettings.name,
        address: newSettings.address,
        city: newSettings.city,
        phone: newSettings.phone,
        email: newSettings.email,
        logo_url: newSettings.logoUrl,
        receipt_footer: newSettings.receiptFooter
    };

    const { error } = await supabase.from('store_settings').update(dbPayload).eq('id', 1);
    if (error) {
        alert("Erreur sauvegarde paramètres: " + error.message);
    } else {
        setStoreSettings(newSettings);
    }
  };

  const handleRestoreData = (data: BackupData) => {
    alert("Note : La restauration met à jour l'affichage actuel mais ne remplace pas encore toutes les données en base de données pour des raisons de sécurité. Veuillez procéder par saisie manuelle pour les données critiques.");
    if (data.storeSettings) setStoreSettings(data.storeSettings);
    if (data.products) setProducts(data.products);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.transactions) setTransactions(data.transactions);
  };

  // POS Transaction
  const handleCompleteTransaction = async (items: CartItem[], total: number) => {
    if (!supabase) return;

    // 1. Insert Transaction
    const transactionPayload = {
        date: new Date().toISOString(),
        cashier_id: currentUser?.id || 'unknown',
        total: total,
        items: items
    };

    const { data: transData, error: transError } = await supabase.from('transactions').insert(transactionPayload).select();
    
    if (transError) {
        alert("Erreur lors de la transaction: " + transError.message);
        return;
    }

    if (transData) {
        const newTrans = mapTransactionFromDb(transData[0]);
        setTransactions(prev => [newTrans, ...prev]);

        // 2. Update Stocks (Optimistic UI update + DB calls)
        const updatedProducts = [...products];
        
        for (const item of items) {
            const productIndex = updatedProducts.findIndex(p => p.id === item.id);
            if (productIndex > -1) {
                const newStock = Math.max(0, updatedProducts[productIndex].stock - item.quantity);
                updatedProducts[productIndex] = { ...updatedProducts[productIndex], stock: newStock };
                
                await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            }
        }
        setProducts(updatedProducts);
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Chargement des données Supabase...</p>
          </div>
      );
  }

  // --- SETUP SCREEN (If tables are missing) ---
  if (missingTables) {
      const sqlScript = `
-- Création de la table Fournisseurs
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Création de la table Produits
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Création de la table Transactions (Ventes)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  cashier_id TEXT,
  total NUMERIC NOT NULL,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Création de la table Paramètres Boutique
CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  receipt_footer TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertion des paramètres par défaut
INSERT INTO store_settings (id, name, address, receipt_footer)
VALUES (1, 'Ma Boutique', 'Adresse par défaut', 'Merci de votre visite')
ON CONFLICT DO NOTHING;

-- IMPORTANT: Désactiver RLS pour accès simplifié (ou configurer des policies)
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
      `;

      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8">
                  <div className="flex items-center text-indigo-600 mb-6">
                      <Database size={40} className="mr-4" />
                      <h1 className="text-2xl font-bold">Initialisation de la Base de Données</h1>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start">
                      <AlertTriangle className="text-amber-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                          <p className="font-bold text-amber-800">Aucune donnée trouvée</p>
                          <p className="text-sm text-amber-700 mt-1">
                              L'application est connectée à Supabase, mais les tables nécessaires n'existent pas encore.
                          </p>
                      </div>
                  </div>

                  <p className="mb-4 text-slate-700">
                      Veuillez exécuter le script SQL suivant dans l'<strong>Éditeur SQL</strong> de votre projet Supabase pour créer la structure :
                  </p>

                  <div className="relative mb-6 group">
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                          {sqlScript}
                      </pre>
                      <button 
                        onClick={() => {
                            navigator.clipboard.writeText(sqlScript);
                            alert("Code SQL copié dans le presse-papier !");
                        }}
                        className="absolute top-2 right-2 bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center hover:bg-indigo-700"
                      >
                          <Copy size={12} className="mr-1" /> Copier le SQL
                      </button>
                  </div>

                  <div className="flex justify-end gap-3">
                      <a 
                        href="https://supabase.com/dashboard/project/_/sql" 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
                      >
                          Ouvrir Supabase
                      </a>
                      <button 
                        onClick={fetchData}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                      >
                          <CheckCircle size={18} className="mr-2" /> J'ai exécuté le script, réessayer
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard transactions={transactions} products={products} />;
      case 'reports':
        return <ReportDashboard transactions={transactions} products={products} />;
      case 'settings':
        return (
            <Settings 
                storeSettings={storeSettings} 
                onUpdateSettings={handleUpdateSettings}
                products={products}
                suppliers={suppliers}
                transactions={transactions}
                onRestoreData={handleRestoreData}
            />
        );
      case 'pos':
        return <POSInterface products={products} storeSettings={storeSettings} onCompleteTransaction={handleCompleteTransaction} />;
      case 'inventory':
        return (
          <InventoryManager 
            products={products} 
            suppliers={suppliers}
            onUpdateProduct={handleUpdateProduct} 
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'suppliers':
        return (
          <SupplierManager 
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        );
      case 'my-sales':
        const mySales = transactions.filter(t => t.cashierId === currentUser.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-slate-800">Mes Ventes</h2>
             <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Articles</th>
                            <th className="p-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mySales.map(t => (
                            <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="p-4">{new Date(t.date).toLocaleString()}</td>
                                <td className="p-4">{t.items.length} articles</td>
                                <td className="p-4 text-right font-bold text-indigo-600">{t.total.toFixed(2)} €</td>
                            </tr>
                        ))}
                         {mySales.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-400">Aucune vente enregistrée</td></tr>}
                    </tbody>
                </table>
             </div>
          </div>
        );
      default:
        return <div className="p-10 text-center text-slate-400">Vue en construction: {currentView}</div>;
    }
  };

  return (
    <Layout 
      user={currentUser} 
      onLogout={() => setCurrentUser(null)}
      currentView={currentView}
      onNavigate={setCurrentView}
    >
      {error ? (
          <div className="p-8 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <h3 className="font-bold text-lg mb-2">Erreur de Connexion Supabase</h3>
              <p className="mb-4">{error}</p>
              <div className="text-sm bg-white p-4 rounded border border-red-100 mb-4">
                  <strong>Solution probable :</strong> Vous devez désactiver RLS dans Supabase ou créer les tables.
                  <br />
                  Si les tables sont manquantes, l'écran d'initialisation aurait dû apparaître.
                  Si les tables existent, allez dans l'éditeur SQL de Supabase et exécutez :
                  <code className="block bg-slate-100 p-2 mt-2 rounded font-mono text-slate-700">
                      ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;<br/>
                      ALTER TABLE products DISABLE ROW LEVEL SECURITY;<br/>
                      ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;<br/>
                      ALTER TABLE store_settings DISABLE ROW LEVEL SECURITY;
                  </code>
              </div>
              <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Réessayer</button>
          </div>
      ) : renderContent()}
    </Layout>
  );
};

export default App;