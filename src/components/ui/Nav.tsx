import React from 'react';
import { ShoppingBag, User as UserIcon, Shield, Menu, X } from 'lucide-react';

export interface NavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  cartItemCount?: number;
  user?: { name: string; email: string; role: string } | null;
  onLogout?: () => void;
}

export const Nav: React.FC<NavProps> = ({
  currentRoute,
  onNavigate,
  cartItemCount = 0,
  user,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: 'Shop', route: '/products' },
    { label: 'Categories', route: '/categories' },
    { label: 'Style guide', route: '/style-guide' },
  ];

  return (
    <header className="w-full bg-[#F2F1ED] border-b border-[rgba(139,122,114,0.2)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo left */}
        <button
          onClick={() => onNavigate('/')}
          className="text-2xl font-serif tracking-tight text-[#17181C] hover:text-[#A6824C] transition-colors cursor-pointer"
        >
          Atelier
        </button>

        {/* Links right */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-sans text-[#17181C]">
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => onNavigate(link.route)}
              className={`hover:text-[#A6824C] transition-colors cursor-pointer py-1 ${
                currentRoute === link.route ? 'border-b border-[#17181C] font-medium' : ''
              }`}
            >
              {link.label}
            </button>
          ))}

          {/* User state / Auth */}
          <div className="flex items-center gap-5 ml-4 pl-4 border-l border-[rgba(139,122,114,0.25)]">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate('/profile')}
                  className={`text-xs flex items-center gap-1.5 hover:text-[#A6824C] transition-colors cursor-pointer ${
                    currentRoute === '/profile' ? 'font-semibold' : ''
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{user.name.split(' ')[0]}</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => onNavigate('/admin')}
                    className="text-xs flex items-center gap-1 text-[#2F4739] font-medium hover:text-[#A6824C] transition-colors cursor-pointer px-2 py-0.5 border border-[rgba(47,71,57,0.3)]"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="text-xs text-[#8B7A72] hover:text-[#17181C] transition-colors cursor-pointer"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('/login')}
                  className="text-xs hover:text-[#A6824C] transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="text-xs px-2.5 py-1 bg-[#17181C] text-[#F2F1ED] hover:bg-[#A6824C] transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Cart bag */}
            <button
              onClick={() => onNavigate('/cart')}
              className="relative p-1 text-[#17181C] hover:text-[#A6824C] transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#17181C] text-[#F2F1ED] text-[10px] w-4 h-4 flex items-center justify-center tabular-nums">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => onNavigate('/cart')}
            className="relative p-1 text-[#17181C]"
            aria-label="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#17181C] text-[#F2F1ED] text-[10px] w-4 h-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-[#17181C]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(139,122,114,0.2)] bg-[#F2F1ED] p-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => {
                onNavigate(link.route);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-sm text-[#17181C]"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[rgba(139,122,114,0.2)] flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm text-[#17181C]"
                >
                  My profile ({user.name})
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      onNavigate('/admin');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-sm text-[#2F4739] font-medium"
                  >
                    Admin dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm text-[#8B7A72]"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm text-[#17181C]"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    onNavigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm text-[#17181C] font-medium"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
