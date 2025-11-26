import React, { useState } from 'react';
import { Product, Transaction, UserRole } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateBusinessInsight } from '../../services/geminiService';
import { Sparkles, TrendingUp, Users, AlertCircle, DollarSign, Send } from 'lucide-react';

interface AdminDashboardProps {
  transactions: Transaction[];
  products: Product[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ transactions, products }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [question, setQuestion] = useState('');

  // Calculate stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const totalSalesCount = transactions.length;

  // Calculate Margin (Profit)
  const calculateTotalMargin = () => {
    let margin = 0;
    transactions.forEach(t => {
      t.items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            margin += (item.price - product.purchasePrice) * item.quantity;
        }
      });
    });
    return margin;
  };
  const totalMargin = calculateTotalMargin();

  // Prepare chart data (Sales by Date)
  const salesByDate = transactions.reduce((acc, t) => {
    const date = t.date.split('T')[0];
    acc[date] = (acc[date] || 0) + t.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    amount: salesByDate[date],
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

  const handleAskGemini = async () => {
    if (!question.trim()) return;
    setLoadingInsight(true);
    
    const context = JSON.stringify({
      totalRevenue,
      totalMargin,
      totalSalesCount,
      lowStockProducts: products.filter(p => p.stock < 10).map(p => p.name),
      recentTransactions: transactions.slice(0, 5),
    });

    const answer = await generateBusinessInsight(question, context);
    setInsight(answer);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord Administrateur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-slate-900">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Marge Brute</p>
              <p className="text-2xl font-bold text-emerald-600">{totalMargin.toFixed(2)} €</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ventes Totales</p>
              <p className="text-2xl font-bold text-slate-900">{totalSalesCount}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Alertes Stock</p>
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-red-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Évolution des Ventes (7 derniers jours)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChartComponent data={chartData} />
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-indigo-700">
            <Sparkles size={20} />
            <h2 className="text-lg font-bold">Assistant IA</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 bg-white/50 p-4 rounded-lg border border-indigo-50 min-h-[200px]">
             {insight ? (
               <div className="prose prose-sm text-slate-700 leading-relaxed">
                 {insight}
               </div>
             ) : (
               <p className="text-sm text-slate-400 italic">Posez une question sur vos ventes, vos marges ou la performance de votre magasin...</p>
             )}
          </div>

          <div className="relative">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Quelle est notre rentabilité ?"
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAskGemini()}
            />
            <button 
              onClick={handleAskGemini}
              disabled={loadingInsight}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingInsight ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Organisation des Rôles & Responsabilités</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <RoleCard 
                role={UserRole.ADMIN} 
                title="Administrateur" 
                color="bg-slate-800"
                responsibilities={["Supervision Globale", "Gestion Utilisateurs", "Analyse Financière", "Configuration Système"]}
            />
            <RoleCard 
                role={UserRole.GESTOCK} 
                title="Gestock (Logistique)" 
                color="bg-orange-600"
                responsibilities={["Entrées/Sorties Stock", "Gestion Fournisseurs", "Inventaire Physique", "Alertes Réappro."]}
            />
            <RoleCard 
                role={UserRole.CAISSE} 
                title="Caisse (Vente)" 
                color="bg-emerald-600"
                responsibilities={["Encaissement", "Relation Client", "Clôture de Caisse", "Retours Produits"]}
            />
        </div>
      </div>
    </div>
  );
};

const AreaChartComponent: React.FC<{data: any[]}> = ({data}) => (
    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(val) => val.substring(5)} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{ r: 6 }} />
    </LineChart>
);

const RoleCard = ({ role, title, color, responsibilities }: { role: string, title: string, color: string, responsibilities: string[] }) => (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
        <div className={`${color} text-white p-4 text-center`}>
            <h3 className="font-bold text-lg">{title}</h3>
            <span className="text-xs opacity-80 uppercase tracking-wider">{role}</span>
        </div>
        <div className="p-4 bg-slate-50 flex-1">
            <ul className="space-y-2">
                {responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${color.replace('bg-', 'bg-opacity-50 ')} bg-current`}></span>
                        {r}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default AdminDashboard;