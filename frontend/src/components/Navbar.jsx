import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, History, ShoppingBag, LogOut, Layers } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Inventory History', path: '/history', icon: History },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl tracking-tight">
              <Layers className="w-7 h-7 text-indigo-600" />
              <span>StockFlow</span>
            </Link>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                {user?.name || user?.email}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.role || 'staff'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="inline-flex items-center text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
