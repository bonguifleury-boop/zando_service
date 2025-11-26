import React from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { Shield, ShoppingBag, Truck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const getIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield className="w-8 h-8 text-indigo-600" />;
      case UserRole.CAISSE: return <ShoppingBag className="w-8 h-8 text-emerald-600" />;
      case UserRole.GESTOCK: return <Truck className="w-8 h-8 text-orange-600" />;
    }
  };

  const getColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50";
      case UserRole.CAISSE: return "border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50";
      case UserRole.GESTOCK: return "border-orange-200 hover:border-orange-500 hover:bg-orange-50";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">GestPro Enterprise</h1>
          <p className="text-slate-500 text-lg">Sélectionnez votre rôle pour accéder à la plateforme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className={`relative group bg-white p-8 rounded-2xl shadow-sm border-2 transition-all duration-300 transform hover:-translate-y-1 ${getColor(user.role)}`}
            >
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-slate-50 mb-4 group-hover:bg-white transition-colors">
                  {getIcon(user.role)}
                </div>
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full mb-4 border-4 border-white shadow-sm" />
                <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">{user.role}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;