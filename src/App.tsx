/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Nav } from './components/ui/Nav';
import { Toast } from './components/ui/Toast';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { StyleGuidePage } from './pages/StyleGuidePage';

// Admin layout and views
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAdminsPage } from './pages/admin/AdminAdminsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';

import { User, Product, Category, api, setStoredToken, getStoredToken } from './lib/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Direct checkout state for "Buy Now" flow
  const [directCheckoutItem, setDirectCheckoutItem] = useState<{ productId: string; quantity: number } | null>(null);

  // Catalog global cache
  const [homeProducts, setHomeProducts] = useState<Product[]>([]);
  const [homeCategories, setHomeCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Initial route from URL path
    const path = window.location.pathname || '/';
    setCurrentRoute(path);

    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);

    // Initial auth check and cart count
    initApp();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const initApp = async () => {
    try {
      const authRes = await api.getMe();
      if (authRes.user) {
        setCurrentUser(authRes.user);
        refreshCartCount();
      }
    } catch {
      // Guest session
    }

    try {
      const [pRes, cRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setHomeProducts(Array.isArray(pRes?.products) ? pRes.products : []);
      setHomeCategories(Array.isArray(cRes?.categories) ? cRes.categories : []);
    } catch (err) {
      console.error(err);
      setHomeProducts([]);
      setHomeCategories([]);
    }
  };

  const refreshCartCount = async () => {
    try {
      const cart = await api.getCart();
      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(count);
    } catch {
      setCartItemCount(0);
    }
  };

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  const handleAddToCart = async (productId: string, quantity = 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      await api.addToCart(productId, quantity);
      await refreshCartCount();
      setToastMessage({
        title: 'Added to shopping basket',
        desc: 'Piece added. View your basket anytime to adjust quantity.',
      });
    } catch (err: any) {
      alert(err.message || 'Could not add item to basket');
    }
  };

  const handleBuyNow = (productId: string, quantity = 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setDirectCheckoutItem({ productId, quantity });
    navigate('/checkout');
  };

  // Explicit cleanup routine that force-resets currentUser and cart state immediately
  const performImmediateAuthCleanup = () => {
    setCurrentUser(null);
    setCartItemCount(0);
    setDirectCheckoutItem(null);
    setStoredToken(null);
  };

  const handleLogout = async () => {
    // 1. Explicit immediate cleanup: force-reset currentUser and cart state immediately
    performImmediateAuthCleanup();

    try {
      await api.logout();
    } catch (err) {
      console.error('[handleLogout] Logout API call failed:', err);
    } finally {
      // 2. Guaranteed cleanup: ensure this cleanup runs regardless of whether
      // the server-side logout call succeeds or fails
      performImmediateAuthCleanup();

      setToastMessage({
        title: 'Signed out',
        desc: 'You have been successfully signed out.',
      });
      navigate('/');
    }
  };

  // Determine current page based on pathname
  const isAdminRoute = currentRoute.startsWith('/admin') && currentRoute !== '/admin/login';

  // Check admin authorization
  if (isAdminRoute && (!currentUser || currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#F2F1ED] text-[#17181C]">
        <Nav
          currentRoute={currentRoute}
          onNavigate={navigate}
          cartItemCount={cartItemCount}
          user={currentUser}
          onLogout={handleLogout}
        />
        <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
          <p className="text-xs text-[#8B261D] font-mono tracking-wider uppercase">Restricted zone</p>
          <h1 className="text-3xl font-serif text-[#17181C]">Administrator access required</h1>
          <p className="text-sm text-[#8B7A72]">
            This section requires verified administrator credentials (<span className="font-mono">role = admin</span>).
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 bg-[#17181C] text-[#F2F1ED] text-xs font-medium cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              Go to administrator login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin View
  if (isAdminRoute) {
    let adminContent: React.ReactNode = null;

    if (currentRoute === '/admin' || currentRoute === '/admin/dashboard') {
      adminContent = <AdminOverviewPage onNavigate={navigate} />;
    } else if (currentRoute === '/admin/products') {
      adminContent = <AdminProductsPage />;
    } else if (currentRoute === '/admin/categories') {
      adminContent = <AdminCategoriesPage />;
    } else if (currentRoute === '/admin/users') {
      adminContent = <AdminUsersPage />;
    } else if (currentRoute === '/admin/admins') {
      adminContent = <AdminAdminsPage currentUser={currentUser} />;
    } else if (currentRoute === '/admin/orders') {
      adminContent = <AdminOrdersPage />;
    } else {
      adminContent = <AdminOverviewPage onNavigate={navigate} />;
    }

    return (
      <AdminLayout
        currentRoute={currentRoute}
        user={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        {adminContent}
      </AdminLayout>
    );
  }

  // Parse storefront subroutes
  let mainContent: React.ReactNode = null;

  if (currentRoute === '/') {
    mainContent = (
      <HomePage
        products={homeProducts}
        categories={homeCategories}
        onNavigate={navigate}
        onAddToCart={(id, e) => handleAddToCart(id, 1, e)}
        onBuyNow={(id, e) => handleBuyNow(id, 1, e)}
      />
    );
  } else if (currentRoute === '/style-guide') {
    mainContent = <StyleGuidePage />;
  } else if (currentRoute.startsWith('/products')) {
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('category') || undefined;
    mainContent = (
      <ProductsPage
        initialCategory={cat}
        onNavigate={navigate}
        onAddToCart={(id, e) => handleAddToCart(id, 1, e)}
        onBuyNow={(id, e) => handleBuyNow(id, 1, e)}
      />
    );
  } else if (currentRoute.startsWith('/product/')) {
    const productId = currentRoute.replace('/product/', '').split('?')[0];
    mainContent = (
      <ProductDetailPage
        productId={productId}
        onNavigate={navigate}
        onAddToCart={(id, qty) => handleAddToCart(id, qty)}
        onBuyNowDirect={(id, qty) => handleBuyNow(id, qty)}
      />
    );
  } else if (currentRoute === '/categories') {
    mainContent = <CategoriesPage onNavigate={navigate} />;
  } else if (currentRoute === '/cart') {
    mainContent = (
      <CartPage
        onNavigate={navigate}
        onCartChange={refreshCartCount}
      />
    );
  } else if (currentRoute === '/checkout') {
    mainContent = (
      <CheckoutPage
        directProductId={directCheckoutItem?.productId}
        directQuantity={directCheckoutItem?.quantity}
        user={currentUser}
        onNavigate={navigate}
        onOrderSuccess={(orderId) => {
          setDirectCheckoutItem(null);
          refreshCartCount();
          navigate(`/order/${orderId}`);
        }}
      />
    );
  } else if (currentRoute === '/orders') {
    mainContent = <OrdersPage onNavigate={navigate} />;
  } else if (currentRoute.startsWith('/order/')) {
    const orderId = currentRoute.replace('/order/', '').split('?')[0];
    mainContent = <OrderDetailPage orderId={orderId} onNavigate={navigate} />;
  } else if (currentRoute === '/profile') {
    mainContent = (
      <ProfilePage
        user={currentUser}
        onUpdateUser={(u) => setCurrentUser(u)}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
    );
  } else if (currentRoute === '/login') {
    mainContent = (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          refreshCartCount();
        }}
        onNavigate={navigate}
      />
    );
  } else if (currentRoute === '/signup') {
    mainContent = (
      <SignupPage
        onSignupSuccess={(u) => {
          setCurrentUser(u);
          refreshCartCount();
        }}
        onNavigate={navigate}
      />
    );
  } else if (currentRoute === '/admin/login') {
    mainContent = (
      <AdminLoginPage
        onAdminLoginSuccess={(u) => {
          setCurrentUser(u);
          navigate('/admin');
        }}
        onNavigate={navigate}
      />
    );
  } else {
    // 404 fallback
    mainContent = (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-3xl font-serif text-[#17181C]">Page not found</h1>
        <p className="text-sm text-[#8B7A72]">The requested route does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#17181C] text-[#F2F1ED] text-xs font-medium cursor-pointer"
          style={{ borderRadius: 0 }}
        >
          Return to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F1ED] text-[#17181C] font-sans antialiased flex flex-col justify-between">
      <div>
        <Nav
          currentRoute={currentRoute}
          onNavigate={navigate}
          cartItemCount={cartItemCount}
          user={currentUser}
          onLogout={handleLogout}
        />

        <main>
          {mainContent}
        </main>
      </div>

      {/* Global Toast Component */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            title={toastMessage.title}
            description={toastMessage.desc}
            variant="forest"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
