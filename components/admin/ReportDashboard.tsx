import React from 'react';
import { Transaction, Product } from '../../types';
import { FileText, TrendingUp, DollarSign, Package, Download } from 'lucide-react';

interface ReportDashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ transactions, products }) => {
  // Financial Calculations
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalVAT = totalRevenue * 0.20; // Assuming 20% flat tax for example
  const totalNet = totalRevenue - totalVAT;

  // Inventory Valuation
  const stockValueBuy = products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0);
  const stockValueSell = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const potentialMargin = stockValueSell - stockValueBuy;

  // Top Products
  const productSales = new Map<string, number>();
  transactions.forEach(t => {
      t.items.forEach(item => {
          const current = productSales.get(item.name) || 0;
          productSales.set(item.name, current + item.quantity);
      });
  });

  const bestSellers = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-slate-800">Rapports Financiers & Stocks</h1>
             <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                <Download size={18} className="mr-2" /> Exporter / Imprimer
             </button>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Chiffre d'Affaires Total</h3>
                <p className="text-3xl font-bold text-indigo-600">{totalRevenue.toFixed(2)} €</p>
                <div className="mt-4 text-xs text-slate-400">
                    <div className="flex justify-between">
                        <span>Hors Taxe:</span>
                        <span>{totalNet.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                        <span>TVA (20%):</span>
                        <span>{totalVAT.toFixed(2)} €</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Valorisation Stock (Achat)</h3>
                <p className="text-3xl font-bold text-slate-800">{stockValueBuy.toFixed(2)} €</p>
                <p className="text-xs text-slate-400 mt-2">Coût d'acquisition du stock actuel</p>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Marge Potentielle Stock</h3>
                <p className="text-3xl font-bold text-emerald-600">+{potentialMargin.toFixed(2)} €</p>
                <p className="text-xs text-slate-400 mt-2">Si tout le stock est vendu au prix actuel</p>
            </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
                    <TrendingUp className="text-indigo-600 mr-2" size={20} />
                    <h3 className="font-bold text-slate-800">Meilleures Ventes</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-3">Produit</th>
                            <th className="px-6 py-3 text-right">Unités Vendues</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bestSellers.map(([name, qty], index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 font-medium text-slate-700">{name}</td>
                                <td className="px-6 py-4 text-right text-slate-900">{qty}</td>
                            </tr>
                        ))}
                         {bestSellers.length === 0 && (
                            <tr><td colSpan={2} className="p-6 text-center text-slate-400">Pas assez de données</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
                    <FileText className="text-orange-600 mr-2" size={20} />
                    <h3 className="font-bold text-slate-800">Dernières Transactions</h3>
                </div>
                <div className="overflow-y-auto max-h-[300px]">
                    <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.slice().reverse().slice(0, 10).map((t) => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{t.id}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">{t.total.toFixed(2)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReportDashboard;