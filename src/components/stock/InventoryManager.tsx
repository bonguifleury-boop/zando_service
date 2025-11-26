import React, { useState, useEffect } from 'react';
import { Product, Supplier } from '../../types';
import { generateProductDescription } from '../../services/geminiService';
import { Search, Plus, Edit2, Trash2, Save, X, Bot } from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  suppliers: Supplier[];
  onUpdateProduct: (product: Product) => Promise<boolean>;
  onAddProduct: (product: Product) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<void>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, suppliers, onUpdateProduct, onAddProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: 'General', price: 0, purchasePrice: 0, stock: 0, sku: '', description: '', supplierId: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ 
        name: '', 
        category: 'General', 
        price: 0, 
        purchasePrice: 0, 
        stock: 0, 
        sku: '', 
        description: '', 
        imageUrl: `https://picsum.photos/seed/${Date.now()}/300/300`,
        supplierId: '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Validation simple
    if (!formData.name || !formData.sku) {
        alert("Le nom et le SKU sont obligatoires.");
        return;
    }

    setIsSaving(true);

    const productToSave: Product = {
        id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
        name: formData.name,
        category: formData.category || 'General',
        price: Number(formData.price) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        stock: Number(formData.stock) || 0,
        sku: formData.sku,
        description: formData.description || '',
        imageUrl: formData.imageUrl || 'https://picsum.photos/300/300',
        supplierId: formData.supplierId || undefined
    };

    try {
        let success = false;
        if (editingProduct) {
            success = await onUpdateProduct(productToSave);
        } else {
            success = await onAddProduct(productToSave);
        }

        if (success) {
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("Erreur lors de l'enregistrement.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setIsGenerating(true);
    const desc = await generateProductDescription(formData.name, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const getSupplierName = (id?: string) => {
      if (!id) return '-';
      return suppliers.find(s => s.id === id)?.name || 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Stocks (Gestock)</h1>
        <button 
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Nouveau Produit
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par nom ou SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-sm">
              <tr>
                <th className="p-4 border-b border-slate-200">Produit</th>
                <th className="p-4 border-b border-slate-200">SKU</th>
                <th className="p-4 border-b border-slate-200">Fournisseur</th>
                <th className="p-4 border-b border-slate-200 text-right">Achat</th>
                <th className="p-4 border-b border-slate-200 text-right">Vente</th>
                <th className="p-4 border-b border-slate-200 text-right">Marge</th>
                <th className="p-4 border-b border-slate-200 text-center">Stock</th>
                <th className="p-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const margin = product.price - product.purchasePrice;
                const marginPercent = product.price > 0 ? (margin / product.price) * 100 : 0;
                
                return (
                <tr key={product.id} className="hover:bg-slate-50 group">
                  <td className="p-4 flex items-center gap-3">
                    <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover bg-slate-100" />
                    <div>
                        <span className="font-medium text-slate-900 block">{product.name}</span>
                        <span className="text-xs text-slate-500">{product.category}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{product.sku}</td>
                  <td className="p-4 text-slate-500 text-xs">{getSupplierName(product.supplierId)}</td>
                  <td className="p-4 text-right font-medium text-slate-600">{product.purchasePrice.toFixed(2)} €</td>
                  <td className="p-4 text-right font-medium text-slate-900">{product.price.toFixed(2)} €</td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {margin >= 0 ? '+' : ''}{margin.toFixed(2)} €
                        </span>
                        <span className="text-[10px] text-slate-400">({marginPercent.toFixed(0)}%)</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {filteredProducts.length === 0 && (
                 <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                        Aucun produit trouvé.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'Modifier Produit' : 'Ajouter Produit'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Produit</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Code Barre)</label>
                <input 
                  type="text" 
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="Electronics">Électronique</option>
                    <option value="Home">Maison</option>
                    <option value="Furniture">Mobilier</option>
                    <option value="Accessories">Accessoires</option>
                    <option value="General">Général</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                <select 
                  value={formData.supplierId || ''}
                  onChange={e => setFormData({...formData, supplierId: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="">-- Sélectionner --</option>
                    {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Initial</label>
                <input 
                  type="number" 
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix d'Achat (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix de Vente (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                       <span className="text-xs text-slate-500">Marge estimée: </span>
                       <span className={`font-bold ${(formData.price || 0) - (formData.purchasePrice || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {((formData.price || 0) - (formData.purchasePrice || 0)).toFixed(2)} €
                       </span>
                  </div>
              </div>

              <div className="col-span-2">
                 <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <button 
                        onClick={handleGenerateDescription}
                        disabled={isGenerating || !formData.name}
                        className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                    >
                        {isGenerating ? 'Génération...' : <><Bot size={14} className="mr-1"/> Générer avec IA</>}
                    </button>
                 </div>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md"
                    disabled={isSaving}
                >
                    Annuler
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <Save size={18} className="mr-2" /> 
                    )}
                    Enregistrer
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;