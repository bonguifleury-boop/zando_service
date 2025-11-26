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
import { INITIAL_STORE_SETTINGS, INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from './constants';
import { db, isFirebaseConfigured } from './services/firebaseConfig';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    writeBatch,
    query, 
    orderBy,
    runTransaction
} from 'firebase/firestore';
import { Database, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
        if (!isFirebaseConfigured()) {
            throw new Error("CONFIGURATION_REQUIRED");
        }

        // 1. Settings
        const settingsSnap = await getDocs(collection(db, 'store_settings'));
        if (!settingsSnap.empty) {
            const settingsData = settingsSnap.docs[0].data() as StoreSettings;
            setStoreSettings(settingsData);
        } else {
            setMissingData(true);
            setIsLoading(false);
            return; 
        }

        // 2. Suppliers
        const suppliersSnap = await getDocs(collection(db, 'suppliers'));
        setSuppliers(suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));

        // 3. Products
        const productsSnap = await getDocs(collection(db, 'products'));
        setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

        // 4. Transactions
        try {
            const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
            const transactionsSnap = await getDocs(q);
            setTransactions(transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (e) {
            console.warn("Tri Firestore manquant ou index inexistant, application du tri client.");
            const transactionsSnap = await getDocs(collection(db, 'transactions'));
            const rawTrans = transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
            setTransactions(rawTrans.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }

    } catch (err: any) {
        console.error("Error fetching data:", err);
        if (err.message === "CONFIGURATION_REQUIRED") {
            setError("Veuillez configurer vos clés Firebase dans src/services/firebaseConfig.ts");
        } else if (err.code === 'permission-denied') {
            setError("Permission refusée (Firestore). Vérifiez que vos Règles de Sécurité dans la console Firebase sont en mode 'Test'.");
        } else if (err.code === 'unavailable') {
            setError("Impossible de joindre Firebase. Vérifiez votre connexion internet.");
        } else {
            setError("Impossible de charger les données. Vérifiez que la base Firestore est bien créée dans la console.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
        fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') setCurrentView('dashboard');
      if (currentUser.role === 'CAISSE') setCurrentView('pos');
      if (currentUser.role === 'GESTOCK') setCurrentView('inventory');
    }
  }, [currentUser]);

  // --- Handlers (Firebase) ---

  const handleAddProduct = async (newProduct: Product): Promise<boolean> => {
    try {
        const { id, ...productData } = newProduct;
        const docRef = await addDoc(collection(db, 'products'), productData);
        const addedProduct = { ...newProduct, id: docRef.id };
        setProducts(prev => [...prev, addedProduct]);
        return true;
    } catch (e) {
        console.error(e);
        alert("Erreur ajout produit Firebase");
        return false;
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product): Promise<boolean> => {
    try {
        const productRef = doc(db, 'products', updatedProduct.id);
        const { id, ...data } = updatedProduct;
        await updateDoc(productRef, data);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        return true;
    } catch (e) {
        console.error(e);
        alert("Erreur mise à jour produit Firebase");
        return false;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'products', id));
        setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
        console.error(e);
        alert("Erreur suppression produit Firebase");
    }
  };

  const handleAddSupplier = async (newSupplier: Supplier): Promise<boolean> => {
      try {
          const { id, ...data } = newSupplier;
          const docRef = await addDoc(collection(db, 'suppliers'), data);
          setSuppliers(prev => [...prev, { ...newSupplier, id: docRef.id }]);
          return true;
      } catch (e) {
          console.error(e);
          alert("Erreur ajout fournisseur Firebase");
          return false;
      }
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier): Promise<boolean> => {
      try {
          const { id, ...data } = updatedSupplier;
          await updateDoc(doc(db, 'suppliers', id), data);
          setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
          return true;
      } catch (e) {
          alert("Erreur mise à jour fournisseur Firebase");
          return false;
      }
  };

  const handleDeleteSupplier = async (id: string): Promise<boolean> => {
      try {
          await deleteDoc(doc(db, 'suppliers', id));
          setSuppliers(prev => prev.filter(s => s.id !== id));
          return true;
      } catch (e) {
          alert("Erreur suppression fournisseur Firebase");
          return false;
      }
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    try {
        const settingsSnap = await getDocs(collection(db, 'store_settings'));
        if (!settingsSnap.empty) {
            const id = settingsSnap.docs[0].id;
            await updateDoc(doc(db, 'store_settings', id), newSettings as any);
        } else {
            await addDoc(collection(db, 'store_settings'), newSettings);
        }
        setStoreSettings(newSettings);
    } catch (e) {
        alert("Erreur sauvegarde paramètres Firebase");
    }
  };

  // Restore Data Logic
  const handleRestoreData = async (data: BackupData) => {
    if (!confirm("Attention : La restauration va écraser les données Firebase existantes. Continuer ?")) return;
    setIsLoading(true);
    try {
        const commitChunk = async (collectionName: string, items: any[]) => {
            const CHUNK_SIZE = 400; 
            for (let i = 0; i < items.length; i += CHUNK_SIZE) {
                const chunk = items.slice(i, i + CHUNK_SIZE);
                const batch = writeBatch(db);
                chunk.forEach(item => {
                    const ref = doc(db, collectionName, item.id);
                    batch.set(ref, item);
                });
                await batch.commit();
            }
        };

        const batch = writeBatch(db);
        if (data.storeSettings) {
             const settingsSnap = await getDocs(collection(db, 'store_settings'));
             let settingsId = 'config';
             if (!settingsSnap.empty) settingsId = settingsSnap.docs[0].id;
             const settingsRef = doc(db, 'store_settings', settingsId);
             batch.set(settingsRef, data.storeSettings);
             await batch.commit();
        }

        if (data.suppliers) await commitChunk('suppliers', data.suppliers);
        if (data.products) await commitChunk('products', data.products);
        if (data.transactions) await commitChunk('transactions', data.transactions);

        alert("Restauration terminée !");
        await fetchData();

    } catch (e: any) {
        console.error(e);
        alert("Erreur restauration : " + e.message);
    } finally {
        setIsLoading(false);
    }
  };

  // POS Transaction with ACID Transaction (Atomic)
  const handleCompleteTransaction = async (items: CartItem[], total: number) => {
    try {
        const newTransaction = {
            date: new Date().toISOString(),
            cashierId: currentUser?.id || 'unknown',
            total: total,
            items: items
        };

        await runTransaction(db, async (transaction) => {
            // 1. Check stock availability for all items first
            const productReads = items.map(item => transaction.get(doc(db, 'products', item.id)));
            const productDocs = await Promise.all(productReads);
            
            // Validate stock
            for (let i = 0; i < productDocs.length; i++) {
                if (!productDocs[i].exists()) {
                    throw new Error(`Le produit ${items[i].name} n'existe plus.`);
                }
                
                const productData = productDocs[i].data() as Product;
                const newStock = productData.stock - items[i].quantity;
                
                if (newStock < 0) {
                    throw new Error(`Stock insuffisant pour ${items[i].name}. Disponible: ${productData.stock}`);
                }

                // 2. Queue Update
                transaction.update(doc(db, 'products', items[i].id), { stock: newStock });
            }

            // 3. Create Transaction Record
            const transRef = doc(collection(db, 'transactions'));
            transaction.set(transRef, newTransaction);
        });

        // 4. Update UI (Reload data to be safe and synced)
        // Optimistic update for UI speed could be done, but reloading ensures sync.
        // Let's do a partial refresh or optimistic update:
        const updatedProducts = [...products];
        items.forEach(item => {
             const idx = updatedProducts.findIndex(p => p.id === item.id);
             if (idx > -1) updatedProducts[idx].stock -= item.quantity;
        });
        setProducts(updatedProducts);
        
        // Add transaction to list locally
        setTransactions(prev => [{ id: 'temp-' + Date.now(), ...newTransaction } as Transaction, ...prev]);

    } catch (e: any) {
        console.error(e);
        alert("Erreur Transaction : " + e.message);
    }
  };

  // --- RESET DATABASE (DANGER ZONE) ---
  const handleResetDatabase = async () => {
    if(!confirm("Êtes-vous SÛR de vouloir tout effacer ? Cette action est irréversible.")) return;
    setIsLoading(true);
    try {
        const collections = ['products', 'suppliers', 'transactions', 'store_settings'];
        for (const colName of collections) {
            const snap = await getDocs(collection(db, colName));
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        setProducts([]);
        setSuppliers([]);
        setTransactions([]);
        setMissingData(true); // Will trigger the setup screen
        alert("Base de données effacée.");
    } catch(e) {
        console.error(e);
        alert("Erreur lors de la réinitialisation.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- SEED DATABASE ---
  const handleInitializeFirebase = async () => {
      setIsLoading(true);
      try {
          await addDoc(collection(db, 'store_settings'), INITIAL_STORE_SETTINGS);

          const supplierMap: Record<string, string> = {}; 
          for (const s of INITIAL_SUPPLIERS) {
              const { id, ...data } = s; 
              const ref = await addDoc(collection(db, 'suppliers'), data);
              supplierMap[s.id] = ref.id; 
          }

          for (const p of INITIAL_PRODUCTS) {
              const { id, supplierId, ...data } = p;
              const newSupplierId = supplierId && supplierMap[supplierId] ? supplierMap[supplierId] : null;
              await addDoc(collection(db, 'products'), { ...data, supplierId: newSupplierId });
          }
          await fetchData();
      } catch (e: any) {
          console.error(e);
          let msg = e.message;
          if (e.code === 'permission-denied') msg = "Permission refusée. Vérifiez vos règles Firestore.";
          alert("Erreur initialisation : " + msg);
      } finally {
          setIsLoading(false);
      }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Synchronisation Firebase...</p>
          </div>
      );
  }

  if (missingData) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                      <Flame size={40} className="text-orange-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">Bienvenue sur GestPro (Firebase)</h1>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6 text-left flex items-start">
                     <CheckCircle2 className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
                     <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">Dernière étape requise :</p>
                        <p>Assurez-vous d'avoir créé la base de données <strong>Firestore</strong> dans votre console Firebase (Projet: agir-72b37).</p>
                        <p className="mt-1">Si ce n'est pas fait, l'initialisation ci-dessous échouera.</p>
                     </div>
                  </div>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Votre base de données est vide. Initialisez-la avec les données de démonstration.
                  </p>
                  <button 
                    onClick={handleInitializeFirebase}
                    className="bg-orange-600 text-white px-8 py-3 rounded-xl hover:bg-orange-700 font-bold shadow-lg shadow-orange-200 transition-all flex items-center justify-center mx-auto"
                  >
                      <Database size={20} className="mr-2" /> Initialiser la Base de Données
                  </button>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <AdminDashboard transactions={transactions} products={products} />;
      case 'reports': return <ReportDashboard transactions={transactions} products={products} />;
      case 'settings':
        return (
            <Settings 
                storeSettings={storeSettings} 
                onUpdateSettings={handleUpdateSettings}
                products={products}
                suppliers={suppliers}
                transactions={transactions}
                onRestoreData={handleRestoreData}
                onResetDatabase={handleResetDatabase}
            />
        );
      case 'pos': return <POSInterface products={products} storeSettings={storeSettings} onCompleteTransaction={handleCompleteTransaction} />;
      case 'inventory':
        return <InventoryManager products={products} suppliers={suppliers} onUpdateProduct={handleUpdateProduct} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'suppliers':
        return <SupplierManager suppliers={suppliers} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} />;
      case 'my-sales':
        const mySales = transactions.filter(t => t.cashierId === currentUser.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-slate-800">Mes Ventes</h2>
             <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Date</th><th className="p-4">Articles</th><th className="p-4 text-right">Total</th></tr></thead>
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
      default: return null;
    }
  };

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)} currentView={currentView} onNavigate={setCurrentView}>
      {error ? (
          <div className="p-8 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <h3 className="font-bold text-lg mb-2 flex items-center"><ShieldAlert className="mr-2"/> Erreur Firebase</h3>
              <p className="mb-4 font-medium">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Réessayer</button>
          </div>
      ) : renderContent()}
    </Layout>
  );
};

export default App;