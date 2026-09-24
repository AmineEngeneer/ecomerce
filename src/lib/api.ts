// Client API service with credentials handling

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  category?: string;
  image: string;
  total: number;
}

export interface CartResponse {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  city: string;
  country: string;
  postalCode?: string | null;
  createdAt: string;
  items: OrderItem[];
  paymentMethod?: {
    provider: string;
    last4: string;
  } | null;
}

export interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
  recentOrders: Order[];
}

const TOKEN_STORAGE_KEY = 'atelier_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && endpoint !== '/api/auth/me') {
      // Clear potentially invalid token on 401
      setStoredToken(null);
    }
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async signup(data: any) {
    const res = await request<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },
  async login(data: any) {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },
  async adminLogin(data: any) {
    const res = await request<{ user: User; token: string }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },
  async logout() {
    let logoutResult: { success: boolean; message?: string; deletedSessions?: number } = { success: false };
    try {
      logoutResult = await request<{ success: boolean; message?: string; deletedSessions?: number }>(
        '/api/auth/logout',
        { method: 'POST' }
      );
    } catch (err) {
      console.warn('[api.logout] Backend logout request caught error:', err);
    } finally {
      // Guarantee client-side stored token is cleared immediately
      setStoredToken(null);
    }

    // Secondary verification of the session status
    let sessionActive = false;
    try {
      const verify = await request<{ user: User | null }>('/api/auth/me');
      if (verify && verify.user) {
        sessionActive = true;
        // Force cleanup if session persisted unexpectedly
        setStoredToken(null);
      }
    } catch {
      // Expected 401 or network rejection confirms user is unauthenticated
      sessionActive = false;
    }

    return {
      success: logoutResult.success || !sessionActive,
      message: logoutResult.message || (sessionActive ? 'Session partially active' : 'Session terminated'),
      deletedSessions: logoutResult.deletedSessions ?? 0,
      verifiedLoggedOut: !sessionActive,
    };
  },
  async getMe() {
    return request<{ user: User | null }>('/api/auth/me');
  },
  async updateProfile(data: any) {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async changePassword(data: any) {
    return request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Storefront Products & Categories
  async getProducts(params?: { category?: string; search?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<{ products: Product[] }>(`/api/products${queryString}`);
  },
  async getProduct(id: string) {
    return request<{ product: Product }>(`/api/products/${id}`);
  },
  async getCategories() {
    return request<{ categories: Category[] }>('/api/categories');
  },

  // Cart
  async getCart() {
    return request<CartResponse>('/api/cart');
  },
  async addToCart(productId: string, quantity = 1) {
    return request<{ success: boolean }>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },
  async updateCartItem(id: string, quantity: number) {
    return request<{ success: boolean }>(`/api/cart/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  async removeCartItem(id: string) {
    return request<{ success: boolean }>(`/api/cart/items/${id}`, {
      method: 'DELETE',
    });
  },
  async clearCart() {
    return request<{ success: boolean }>('/api/cart', {
      method: 'DELETE',
    });
  },

  // Checkout & Orders
  async checkout(data: any) {
    return request<{ success: boolean; orderId: string; orderNumber: string; total: number }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async getOrders() {
    return request<{ orders: Order[] }>('/api/orders');
  },
  async getOrder(id: string) {
    return request<{ order: Order }>(`/api/orders/${id}`);
  },

  // Payment Methods
  async getPaymentMethods() {
    return request<{ paymentMethods: PaymentMethod[] }>('/api/payment-methods');
  },
  async addPaymentMethod(data: any) {
    return request<{ paymentMethod: PaymentMethod }>('/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deletePaymentMethod(id: string) {
    return request<{ success: boolean }>(`/api/payment-methods/${id}`, {
      method: 'DELETE',
    });
  },

  // Image Upload
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const headers: Record<string, string> = {};
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data as { url: string };
  },

  // Admin APIs
  async getAdminStats() {
    return request<AdminStats>('/api/admin/stats');
  },
  async getAdminProducts() {
    return request<{ products: Product[] }>('/api/admin/products');
  },
  async createProduct(data: any) {
    return request<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateProduct(id: string, data: any) {
    return request<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteProduct(id: string) {
    return request<{ success: boolean; message?: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
  async getAdminCategories() {
    return request<{ categories: Category[] }>('/api/admin/categories');
  },
  async createCategory(data: any) {
    return request<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateCategory(id: string, data: any) {
    return request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteCategory(id: string) {
    return request<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
  async getAdminUsers() {
    return request<{ users: User[] }>('/api/admin/users');
  },
  async createAdminUser(data: any) {
    return request<{ user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateAdminUser(id: string, data: any) {
    return request<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteAdminUser(id: string) {
    return request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
  async getAdminAdmins() {
    return request<{ admins: User[] }>('/api/admin/admins');
  },
  async createAdmin(data: any) {
    return request<{ admin: User }>('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateAdmin(id: string, data: any) {
    return request<{ admin: User }>(`/api/admin/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteAdmin(id: string) {
    return request<{ success: boolean }>(`/api/admin/admins/${id}`, {
      method: 'DELETE',
    });
  },
  async getAdminOrders(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ orders: Order[] }>(`/api/admin/orders${qs}`);
  },
  async updateOrderStatus(id: string, status: string) {
    return request<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};
