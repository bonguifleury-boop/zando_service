// src/App.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/admin/AdminDashboard';
import ReportDashboard from './components/admin/ReportDashboard';
import Settings from './components/admin/Settings';
import POSInterface from './components/pos/POSInterface';
import InventoryManager from './components/stock/InventoryManager';
import { User, Product, Transaction, CartItem, Supplier, StoreSettings, BackupData } from './types';
import { INITIAL_STORE_SETTINGS, INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from './constants';
import { db, isFirebaseConfigured } from './services/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Database, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

// Lazy load du SupplierManager
const SupplierManager = lazy(() => import('./components/stock/SupplierManager'));

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingData, setMissingData] = useState(false);

  // --- Data Fetching (Firebase) ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setMissingData(false);

    try {
      if (!isFirebaseConfigured()) throw new Error("CONFIGURATION_REQUIRED");

      const settingsSnap = await getDocs(collection(db, 'store_settings'));
      if (!settingsSnap.empty) setStoreSettings(settingsSnap.docs[0].data() as StoreSettings);
      else { setMissingData(true); setIsLoading(false); return; }

      const suppliersSnap = await getDocs(collection(db, 'suppliers'));
      setSuppliers(suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));

      const productsSnap = await getDocs(collection(db, 'products'));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

      try {
        const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
        const transactionsSnap = await getDocs(q);
        setTransactions(transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      } catch {
        const transactionsSnap = await getDocs(collection(db, 'transactions'));
        const rawTrans = transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(rawTrans.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      if (err.message === "CONFIGURATION_REQUIRED") setError("Veuillez configurer vos clés Firebase dans src/services/firebaseConfig.ts");
      else if (err.code === 'permission-denied') setError("Permission refusée (Firestore). Vérifiez vos Règles de Sécurité.");
      else if (err.code === 'unavailable') setError("Impossible de joindre Firebase.");
      else setError("Impossible de charger les données.");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser]);
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') setCurrentView('dashboard');
      if (currentUser.role === 'CAISSE') setCurrentView('pos');
      if (currentUser.role === 'GESTOCK') setCurrentView('inventory');
    }
  }, [currentUser]);

  // --- Handlers simplifiés (ajout, update, delete) ---
  const handleAddSupplier = async (newSupplier: Supplier) => { 
    try { 
      const { id, ...data } = newSupplier; 
      const docRef = await addDoc(collection(db, 'suppliers'), data); 
      setSuppliers(prev => [...prev, { ...newSupplier, id: docRef.id }]); 
      return true; 
    } catch { 
      alert("Erreur ajout fournisseur Firebase"); 
      return false; 
    } 
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => { 
    try { 
      const { id, ...data } = updatedSupplier; 
      await updateDoc(doc(db, 'suppliers', id), data); 
      setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s)); 
      return true; 
    } catch { 
      alert("Erreur mise à jour fournisseur Firebase"); 
      return false; 
    } 
  };

  const handleDeleteSupplier = async (id: string) => { 
    try { 
      await deleteDoc(doc(db, 'suppliers', id)); 
      setSuppliers(prev => prev.filter(s => s.id !== id)); 
      return true; 
    } catch { 
      alert("Erreur suppression fournisseur Firebase"); 
      return false; 
    } 
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderContent = () => {
    switch(currentView) {
      case 'dashboard': return <AdminDashboard transactions={transactions} products={products} />;
      case 'reports': return <ReportDashboard transactions={transactions} products={products} />;
      case 'settings': return <Settings storeSettings={storeSettings} onUpdateSettings={setStoreSettings} products={products} suppliers={suppliers} transactions={transactions} onRestoreData={() => {}} onResetDatabase={() => {}} />;
      case 'pos': return <POSInterface products={products} storeSettings={storeSettings} onCompleteTransaction={() => {}} />;
      case 'inventory': 
        return (
          <InventoryManager
            products={products}
            suppliers={suppliers}
            onUpdateProduct={async (product: Product) => {
              // Si vous avez besoin de l'id et des données partielles, adaptez ici
              console.log("Update product", product.id, product);
              // Votre logique de mise à jour Firebase ici
              return true; // Promise<boolean>
            }}
            onAddProduct={async (product: Product) => {
              console.log("Add product", product);
              // Votre logique d'ajout Firebase ici
              return true; // Promise<boolean>
            }}
            onDeleteProduct={async (id: string) => {
              console.log("Delete product", id);
              // Votre logique de suppression Firebase ici
              // Ne rien retourner car TypeScript attend void
            }}
          />
        );
      case 'suppliers': 
        return (
          <Suspense fallback={<div className="text-center py-10">Chargement du gestionnaire de fournisseurs...</div>}>
            <SupplierManager
              suppliers={suppliers}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          </Suspense>
        );
      default: return null;
    }
  };

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)} currentView={currentView} onNavigate={setCurrentView}>
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
      ) : renderContent()}
    </Layout>
  );
};

export default App;
