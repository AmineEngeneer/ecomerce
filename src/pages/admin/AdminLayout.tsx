import React from 'react';
import { Button } from '../../components/ui/Button';
import { User } from '../../lib/api';

interface AdminLayoutProps {
  currentRoute: string;
  user: User | null;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  user,
  onNavigate,
  onLogout,
  children,
}) => {
  const navItems = [
    { label: 'Overview', route: '/admin' },
    { label: 'Products', route: '/admin/products' },
    { label: 'Categories', route: '/admin/categories' },
    { label: 'Customers', route: '/admin/users' },
    { label: 'Administrators', route: '/admin/admins' },
    { label: 'Orders', route: '/admin/orders' },
  ];

  return (
    <div className="min-h-screen bg-[#F2F1ED] text-[#17181C]">
      {/* Top Admin Bar */}
      <header className="border-b border-[#17181C] bg-[#17181C] text-[#F2F1ED] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-serif text-lg tracking-tight">Atelier</span>
            <span className="text-[11px] bg-[#2F4739] text-[#F2F1ED] px-2 py-0.5 uppercase tracking-wider font-mono">
              Admin console
            </span>
            <span className="text-xs text-[#8B7A72] hidden sm:inline">
              Authenticated: {user?.name || user?.email}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-[#F2F1ED]/80 hover:text-[#A6824C] underline cursor-pointer"
            >
              ← Storefront
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-[#F2F1ED]/80 hover:text-[#8B261D] underline cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Admin Secondary Navigation Bar */}
      <nav className="border-b border-[rgba(139,122,114,0.2)] bg-[#F2F1ED] px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`text-xs px-4 py-2 border transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]'
                    : 'bg-transparent text-[#17181C] border-transparent hover:border-[rgba(139,122,114,0.3)]'
                }`}
                style={{ borderRadius: 0 }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
