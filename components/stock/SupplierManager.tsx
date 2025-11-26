import React, { useState } from 'react';
import { Supplier } from '../../types';
import { Search, Plus, Edit2, Trash2, Save, X, Truck, Phone, Mail, User, AlertCircle } from 'lucide-react';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => Promise<boolean>;
  onUpdateSupplier: (supplier: Supplier) => Promise<boolean>;
  onDeleteSupplier: (id: string) => Promise<boolean>;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '', contactName: '', email: '', phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ ...supplier });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contactName: '', email: '', phone: '' });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
        setErrorMsg("Le nom de l'entreprise est obligatoire.");
        return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    let success = false;

    try {
        if (editingSupplier) {
          success = await onUpdateSupplier({ ...editingSupplier, ...formData } as Supplier);
        } else {
          // Correction explicite : Assignation manuelle des propriétés pour éviter l'erreur TS2783
          const newSupplier: Supplier = {
            id: 'temp', 
            name: formData.name || '',
            contactName: formData.contactName || '',
            email: formData.email || '',
            phone: formData.phone || ''
          };
          success = await onAddSupplier(newSupplier);
        }

        if (success) {
            setIsModalOpen(false);
        } else {
            setErrorMsg("Une erreur est survenue lors de l'enregistrement.");
        }
    } catch (e) {
        console.error(e);
        setErrorMsg("Erreur inattendue.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
          await onDeleteSupplier(id);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Truck className="mr-3 text-indigo-600" />
            Gestion des Fournisseurs
        </h1>
        <button 
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Nouveau Fournisseur
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un fournisseur..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 group hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {supplier.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(supplier)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(supplier.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1">{supplier.name}</h3>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center">
                        <User size={16} className="mr-2 text-slate-400" />
                        <span>{supplier.contactName}</span>
                    </div>
                    <div className="flex items-center">
                        <Mail size={16} className="mr-2 text-slate-400" />
                        <a href={`mailto:${supplier.email}`} className="hover:text-indigo-600">{supplier.email}</a>
                    </div>
                    <div className="flex items-center">
                        <Phone size={16} className="mr-2 text-slate-400" />
                        <span>{supplier.phone}</span>
                    </div>
                </div>
            </div>
        ))}
         {filteredSuppliers.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Truck size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucun fournisseur trouvé.</p>
             </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingSupplier ? 'Modifier Fournisseur' : 'Ajouter Fournisseur'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {errorMsg && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-start">
                      <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <span>{errorMsg}</span>
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'entreprise</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: TechGlobal Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du contact</label>
                <input 
                  type="text" 
                  value={formData.contactName}
                  onChange={e => setFormData({...formData, contactName: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: contact@entreprise.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: +33 6 12 34 56 78"
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
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
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

export default SupplierManager;