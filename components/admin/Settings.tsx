
import React, { useState } from 'react';
import { Product, Supplier, Transaction, StoreSettings, BackupData } from '../../types';
import { Save, Download, Upload, Store, Database, Image as ImageIcon } from 'lucide-react';

interface SettingsProps {
  storeSettings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  products: Product[];
  suppliers: Supplier[];
  transactions: Transaction[];
  onRestoreData: (data: BackupData) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  storeSettings, 
  onUpdateSettings, 
  products, 
  suppliers, 
  transactions,
  onRestoreData
}) => {
  const [formData, setFormData] = useState<StoreSettings>(storeSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'backup'>('general');

  const handleSave = () => {
    onUpdateSettings(formData);
    alert('Paramètres enregistrés avec succès !');
  };

  const handleBackup = () => {
    const backupData: BackupData = {
      version: '1.0',
      date: new Date().toISOString(),
      storeSettings: formData,
      products,
      suppliers,
      transactions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `gestpro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as BackupData;
        if (confirm(`Voulez-vous vraiment restaurer cette sauvegarde du ${new Date(json.date).toLocaleDateString()} ?\n\nATTENTION: Toutes les données actuelles seront remplacées.`)) {
            onRestoreData(json);
        }
      } catch (error) {
        alert("Erreur lors de la lecture du fichier de sauvegarde. Le format est invalide.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center">
        <Store className="mr-3" /> Paramètres de l'Application
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {/* Tabs */}
         <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center ${activeTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                <Store size={18} className="mr-2" /> Configuration Boutique
            </button>
            <button 
                onClick={() => setActiveTab('backup')}
                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center ${activeTab === 'backup' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                <Database size={18} className="mr-2" /> Sauvegarde & Données
            </button>
         </div>

         <div className="p-8">
             {activeTab === 'general' ? (
                 <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 flex items-center space-x-6 bg-slate-50 p-6 rounded-lg border border-dashed border-slate-300">
                             <div className="w-24 h-24 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                                {formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="text-slate-300" size={32} />
                                )}
                             </div>
                             <div className="flex-1">
                                 <label className="block text-sm font-medium text-slate-700 mb-2">Logo de la Boutique (pour tickets)</label>
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                 />
                                 <p className="text-xs text-slate-400 mt-1">Format recommandé: PNG, JPG (Max 500kb)</p>
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la Boutique</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                            <input 
                                type="text" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                            <input 
                                type="text" 
                                value={formData.address} 
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ville / Code Postal</label>
                            <input 
                                type="text" 
                                value={formData.city} 
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optionnel)</label>
                            <input 
                                type="email" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message de pied de page (Ticket)</label>
                            <input 
                                type="text" 
                                value={formData.receiptFooter} 
                                onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                            />
                        </div>
                     </div>
                     <div className="pt-4 flex justify-end">
                         <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center">
                             <Save size={18} className="mr-2" /> Enregistrer les modifications
                         </button>
                     </div>
                 </div>
             ) : (
                 <div className="space-y-8">
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center"><Download className="mr-2" size={20}/> Sauvegarde des Données</h3>
                        <p className="text-blue-700 text-sm mb-4">
                            Téléchargez un fichier complet contenant tous vos produits, fournisseurs, historique des ventes et configuration.
                            Ce fichier peut être utilisé pour restaurer le système en cas de problème ou pour migrer vers un autre appareil.
                        </p>
                        <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                            <Download size={18} className="mr-2" /> Télécharger la Sauvegarde (.json)
                        </button>
                     </div>

                     <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center"><Upload className="mr-2" size={20}/> Restauration des Données</h3>
                        <p className="text-amber-700 text-sm mb-4">
                            Importez un fichier de sauvegarde précédemment créé.
                            <strong className="block mt-1">ATTENTION : Cette action remplacera toutes les données actuelles (Produits, Ventes, Paramètres) par celles du fichier.</strong>
                        </p>
                        <div className="relative inline-block">
                             <input 
                                type="file" 
                                accept=".json"
                                onChange={handleRestore}
                                className="hidden" 
                                id="restore-file"
                             />
                             <label htmlFor="restore-file" className="cursor-pointer bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center">
                                <Upload size={18} className="mr-2" /> Importer une Sauvegarde
                             </label>
                        </div>
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default Settings;
