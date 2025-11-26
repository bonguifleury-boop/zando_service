
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, CartItem, Transaction, StoreSettings } from '../../types';
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Search, Printer, Check, X, ScanBarcode, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface POSInterfaceProps {
  products: Product[];
  storeSettings: StoreSettings;
  onCompleteTransaction: (items: CartItem[], total: number) => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ products, storeSettings, onCompleteTransaction }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{id: string, items: CartItem[], total: number, date: Date} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Filter products for the grid
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Process transaction
    onCompleteTransaction(cart, cartTotal);
    
    // Prepare receipt
    setLastTransaction({
        id: `TX-${Date.now()}`,
        items: [...cart],
        total: cartTotal,
        date: new Date()
    });
    
    // Clear and show receipt
    setCart([]);
    setShowReceipt(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        // Scanner behavior: Exact match on SKU triggers immediate add
        const exactMatch = products.find(p => p.sku.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch && exactMatch.stock > 0) {
            addToCart(exactMatch);
            setSearchTerm(''); // Clear for next scan
        }
    }
  };

  // Manual Scan Simulation
  const handleScanClick = () => {
      if (searchInputRef.current) {
          searchInputRef.current.focus();
      }
  };

  // Camera Scan Logic
  const toggleCameraScan = () => {
      setIsScanning(!isScanning);
  };

  useEffect(() => {
      if (isScanning) {
          // Initialize scanner
          const timer = setTimeout(() => {
              if (!document.getElementById("reader")) {
                  console.error("Reader element not found");
                  return;
              }

              const scanner = new Html5QrcodeScanner(
                  "reader",
                  { 
                      fps: 10, 
                      qrbox: { width: 250, height: 250 },
                      aspectRatio: 1.0,
                      showTorchButtonIfSupported: true,
                      rememberLastUsedCamera: true
                  },
                  /* verbose= */ false
              );
              
              try {
                  scanner.render(onScanSuccess, onScanFailure);
                  scannerRef.current = scanner;
              } catch (e) {
                  console.error("Failed to render scanner", e);
              }
          }, 300);

          return () => {
              clearTimeout(timer);
              if (scannerRef.current) {
                  try {
                      scannerRef.current.clear().catch(error => {
                          console.error("Failed to clear scanner", error);
                      });
                  } catch (e) {
                      console.error("Error clearing scanner", e);
                  }
                  scannerRef.current = null;
              }
          };
      }
  }, [isScanning]);

  const playBeep = () => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
  };

  const onScanSuccess = (decodedText: string) => {
      const now = Date.now();
      // Debounce scans (2 seconds for the same code)
      if (decodedText === lastScannedCodeRef.current && now - lastScanTimeRef.current < 2000) {
          return;
      }

      lastScannedCodeRef.current = decodedText;
      lastScanTimeRef.current = now;

      const product = products.find(p => p.sku === decodedText || p.id === decodedText);
      
      if (product) {
          if (product.stock > 0) {
              playBeep();
              addToCart(product);
          } else {
              alert(`Produit ${product.name} en rupture de stock !`);
          }
      } else {
          console.log(`Produit non trouvé pour le code: ${decodedText}`);
      }
  };

  const onScanFailure = (error: any) => {
     // console.warn(error);
  };

  const printReceipt = () => {
      window.print();
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Product Grid (Left) */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4 relative flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Rechercher ou scanner un produit..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
            </div>
            <button 
                onClick={handleScanClick}
                className="bg-white border border-slate-200 text-slate-600 px-4 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
                title="Focus Recherche"
            >
                <ScanBarcode size={24} />
            </button>
            <button 
                onClick={toggleCameraScan}
                className={`${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm`}
                title="Scanner avec Caméra"
            >
                {isScanning ? <X size={24} /> : <Camera size={24} />}
            </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col items-center text-center transition-all ${
                  product.stock > 0 ? 'hover:shadow-md hover:border-indigo-300 cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed grayscale'
              }`}
            >
              <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-contain mb-3" />
              <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 min-h-[40px]">{product.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{product.sku}</p>
              <div className="mt-auto">
                 <span className="block font-bold text-indigo-600">{product.price.toFixed(2)} €</span>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    Stock: {product.stock}
                 </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar (Right) */}
      <div className="w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full sticky top-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 flex items-center">
            <ShoppingCart className="mr-2" size={20} /> Panier
          </h2>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
            {cart.length} articles
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={48} className="mb-2 opacity-20" />
                <p>Le panier est vide</p>
                <p className="text-xs text-slate-300 mt-2">Scannez un produit pour commencer</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                 <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-sm text-indigo-600 font-semibold">{item.price.toFixed(2)} €</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded">
                        <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-medium text-slate-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded">
                        <Plus size={16} />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-1 p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-4">
            <div className="flex justify-between items-center text-slate-600">
                <span>Sous-total</span>
                <span>{(cartTotal * 0.8).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
                <span>TVA (20%)</span>
                <span>{(cartTotal * 0.2).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>{cartTotal.toFixed(2)} €</span>
            </div>
            
            <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
                <CreditCard className="mr-2" /> Encaisser {cartTotal > 0 && `(${cartTotal.toFixed(2)} €)`}
            </button>
        </div>
      </div>

        {/* Camera Modal */}
        {isScanning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                <div className="bg-white rounded-xl overflow-hidden w-full max-w-md relative">
                    <button 
                        onClick={toggleCameraScan}
                        className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
                    >
                        <X size={24} />
                    </button>
                    <div className="p-4 bg-slate-900 text-white text-center">
                        <h3 className="font-bold">Scanner un produit</h3>
                        <p className="text-xs text-slate-400">Si demandé, autorisez l'accès à la caméra.</p>
                    </div>
                    {/* Background MUST be white for UI visibility */}
                    <div className="bg-white text-slate-900 min-h-[300px] p-4 rounded-b-xl" id="reader"></div>
                </div>
            </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && lastTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                        <h2 className="font-bold flex items-center"><Check className="mr-2"/> Paiement Validé</h2>
                        <button onClick={() => setShowReceipt(false)} className="hover:text-slate-300"><X size={24}/></button>
                    </div>
                    
                    {/* Receipt Preview */}
                    <div className="p-6 bg-slate-50 overflow-y-auto font-mono text-sm leading-relaxed" id="receipt-area">
                        <div className="text-center mb-6">
                            {storeSettings.logoUrl && (
                                <img src={storeSettings.logoUrl} alt="Logo" className="h-16 mx-auto mb-2 object-contain" />
                            )}
                            <h3 className="text-xl font-bold uppercase mb-1">{storeSettings.name}</h3>
                            <p>{storeSettings.address}</p>
                            <p>{storeSettings.city}</p>
                            <p>Tel: {storeSettings.phone}</p>
                            {storeSettings.email && <p className="text-xs mt-1">{storeSettings.email}</p>}
                        </div>
                        
                        <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                            <p>Date: {lastTransaction.date.toLocaleString()}</p>
                            <p>Ticket: #{lastTransaction.id.slice(-6)}</p>
                        </div>

                        <div className="space-y-1 mb-4">
                            {lastTransaction.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span className="truncate w-40">{item.name}</span>
                                    <div className="text-right">
                                        <span>x{item.quantity}</span>
                                        <span className="ml-4">{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-slate-400 pt-2 mb-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL</span>
                                <span>{lastTransaction.total.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span>Dont TVA (20%)</span>
                                <span>{(lastTransaction.total * 0.2).toFixed(2)} €</span>
                            </div>
                        </div>

                        <div className="text-center text-xs mt-6">
                            <p>{storeSettings.receiptFooter}</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
                        <button 
                            onClick={() => setShowReceipt(false)}
                            className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                        >
                            Nouvelle Vente
                        </button>
                        <button 
                            onClick={printReceipt}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center"
                        >
                            <Printer size={18} className="mr-2" /> Imprimer
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POSInterface;
