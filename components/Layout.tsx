
import React from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut, 
  Menu,
  ShieldCheck,
  User as UserIcon,
  Box,
  Truck,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const getMenuItems = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
          { id: 'inventory', label: 'Stocks (Vue Globale)', icon: Package },
          { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
          { id: 'reports', label: 'Rapports', icon: ShieldCheck },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case UserRole.CAISSE:
        return [
          { id: 'pos', label: 'Caisse (POS)', icon: ShoppingCart },
          { id: 'my-sales', label: 'Mes Ventes', icon: UserIcon },
        ];
      case UserRole.GESTOCK:
        return [
          { id: 'inventory', label: 'Gestion Stocks', icon: Package },
          { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
          { id: 'alerts', label: 'Alertes Stock', icon: Box },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center font-bold">G</div>
          <span className="text-xl font-bold tracking-tight">GestPro</span>
        </div>
        
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-600" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-400 font-medium truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-400 bg-slate-800 rounded hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-white shadow-sm h-16 flex items-center justify-between px-4 z-10">
          <span className="text-lg font-bold text-slate-800">GestPro</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900 text-white shadow-xl z-50 p-4">
             {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-slate-800 mb-2"
              >
                <item.icon size={20} className="mr-3" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="border-t border-slate-700 mt-2 pt-2">
              <button onClick={onLogout} className="flex items-center text-red-400 w-full px-4 py-3">
                <LogOut size={20} className="mr-3" /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
