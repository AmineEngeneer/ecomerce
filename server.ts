import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { prisma } from './src/server/db';
import {
  hashPassword,
  comparePassword,
  createSession,
  destroySession,
  getSessionUser,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from './src/server/auth';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  productSchema,
  categorySchema,
  checkoutSchema,
  paymentMethodSchema,
  adminCreateSchema,
} from './src/server/validation';
import { seedDatabase } from './src/server/seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, and GIF images are permitted.'));
    }
  },
});

async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static uploads folder
  app.use('/uploads', express.static(uploadsDir));

  // Run initial database seed
  try {
    await seedDatabase();
  } catch (err) {
    console.error('[Database Seed Error]:', err);
  }

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Customer Signup: Always role = 'user'
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data' });
      }

      const { name, email, password, phone, address, city, country, postalCode } = parsed.data;

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        return res.status(400).json({ error: 'An account with this email address already exists' });
      }

      const passwordHash = await hashPassword(password);

      // Enforce role = 'user' strictly
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          postalCode: postalCode || null,
          role: 'user', // NEVER allow admin via signup
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
        },
      });

      const token = await createSession(user.id, res);

      return res.status(201).json({ user, token });
    } catch (err) {
      console.error('[Signup Error]:', err);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // Customer Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid email and password required' });
      }

      const { email, password } = parsed.data;
      const cleanEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return res.status(401).json({
          error: 'No account found with this email. Please check your address or create an account.',
        });
      }

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({
          error: 'Incorrect password. Please verify your password and try again.',
        });
      }

      const token = await createSession(user.id, res);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          postalCode: user.postalCode,
        },
        token,
      });
    } catch (err) {
      console.error('[Login Error]:', err);
      return res.status(500).json({ error: 'Sign in failed' });
    }
  });

  // Admin Login: Strict role = 'admin' check
  app.post('/api/auth/admin-login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Admin credentials required' });
      }

      const { email, password } = parsed.data;
      const cleanEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        return res.status(401).json({
          error: 'No administrator account found with this email. Please check your credentials.',
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: User is not an administrator' });
      }

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({
          error: 'Incorrect administrator password. Please verify your credentials and try again.',
        });
      }

      const token = await createSession(user.id, res);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      console.error('[Admin Login Error]:', err);
      return res.status(500).json({ error: 'Administrator authentication failed' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const { deleted } = await destroySession(req, res);
      return res.json({
        success: true,
        message: 'Session successfully destroyed and cookie cleared',
        deletedSessions: deleted,
      });
    } catch (err) {
      console.error('[Logout Route Error]:', err);
      return res.status(500).json({ error: 'Failed to destroy session' });
    }
  });

  // Current authenticated user
  app.get('/api/auth/me', async (req, res) => {
    const user = await getSessionUser(req);
    return res.json({ user });
  });

  // Update profile
  app.put('/api/auth/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data' });
      }

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: parsed.data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
        },
      });

      return res.json({ user: updated });
    } catch (err) {
      console.error('[Profile Update Error]:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Change password
  app.put('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password data' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      const match = await comparePassword(parsed.data.currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const newHash = await hashPassword(parsed.data.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      return res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('[Change Password Error]:', err);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // ==========================================
  // STOREFRONT: PRODUCTS & CATEGORIES
  // ==========================================

  // Get all products with filters, sorting, search
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search, sort } = req.query;

      const where: any = {};

      if (category && typeof category === 'string' && category !== 'all') {
        where.OR = [
          { categoryId: category },
          { category: { slug: category } },
        ];
      }

      if (search && typeof search === 'string' && search.trim()) {
        const query = search.trim();
        where.OR = [
          ...(where.OR || []),
          { name: { contains: query } },
          { description: { contains: query } },
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-asc') orderBy = { price: 'asc' };
      if (sort === 'price-desc') orderBy = { price: 'desc' };
      if (sort === 'name-asc') orderBy = { name: 'asc' };

      const products = await prisma.product.findMany({
        where,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, isPrimary: true } },
        },
      });

      return res.json({ products });
    } catch (err) {
      console.error('[Products Fetch Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get single product details
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          category: true,
          images: true,
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json({ product });
    } catch (err) {
      console.error('[Product Details Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch product details' });
    }
  });

  // Get categories with product count
  app.get('/api/categories', async (_req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      return res.json({ categories });
    } catch (err) {
      console.error('[Categories Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // ==========================================
  // CART MANAGEMENT
  // ==========================================

  // Helper to get or create cart for user
  async function getUserCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  // Get user's cart with recalculation
  app.get('/api/cart', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const cart = await getUserCart(req.user!.id);
      
      // Calculate subtotal from authoritative product prices
      let subtotal = 0;
      const formattedItems = cart.items.map((item) => {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        return {
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          stock: item.product.stock,
          quantity: item.quantity,
          category: item.product.category?.name,
          image: item.product.images[0]?.url || '/placeholder.png',
          total: itemTotal,
        };
      });

      return res.json({
        cartId: cart.id,
        items: formattedItems,
        subtotal,
        total: subtotal,
      });
    } catch (err) {
      console.error('[Cart Get Error]:', err);
      return res.status(500).json({ error: 'Failed to load cart' });
    }
  });

  // Add item to cart (with stock validation)
  app.post('/api/cart/items', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      if (!productId || quantity < 1) {
        return res.status(400).json({ error: 'Valid product ID and quantity required' });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const cart = await getUserCart(req.user!.id);
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      const targetQuantity = (existingItem?.quantity || 0) + quantity;
      if (targetQuantity > product.stock) {
        return res.status(400).json({
          error: `Cannot add more than available stock (${product.stock} in stock, currently ${existingItem?.quantity || 0} in cart)`,
        });
      }

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: targetQuantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }

      return res.json({ success: true, message: 'Item added to basket' });
    } catch (err) {
      console.error('[Cart Add Error]:', err);
      return res.status(500).json({ error: 'Failed to add item to basket' });
    }
  });

  // Update cart item quantity
  app.put('/api/cart/items/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { quantity } = req.body;
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      const item = await prisma.cartItem.findUnique({
        where: { id: req.params.id },
        include: { product: true, cart: true },
      });

      if (!item || item.cart.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      if (quantity > item.product.stock) {
        return res.status(400).json({
          error: `Requested quantity exceeds available stock (${item.product.stock} available)`,
        });
      }

      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('[Cart Update Error]:', err);
      return res.status(500).json({ error: 'Failed to update item quantity' });
    }
  });

  // Remove cart item
  app.delete('/api/cart/items/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const item = await prisma.cartItem.findUnique({
        where: { id: req.params.id },
        include: { cart: true },
      });

      if (!item || item.cart.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      await prisma.cartItem.delete({ where: { id: item.id } });
      return res.json({ success: true });
    } catch (err) {
      console.error('[Cart Delete Error]:', err);
      return res.status(500).json({ error: 'Failed to remove item' });
    }
  });

  // Clear cart
  app.delete('/api/cart', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user!.id },
      });
      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('[Cart Clear Error]:', err);
      return res.status(500).json({ error: 'Failed to clear cart' });
    }
  });

  // ==========================================
  // CHECKOUT & ORDERS
  // ==========================================

  // Place order (from cart or direct buy now)
  app.post('/api/checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid checkout information' });
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        country,
        postalCode,
        paymentMethodId,
        directProductId,
        directQuantity = 1,
      } = parsed.data;

      // Determine items to order
      interface OrderItemPlan {
        product: any;
        quantity: number;
        price: number;
        total: number;
      }
      const itemsToOrder: OrderItemPlan[] = [];

      if (directProductId) {
        // Direct "Buy Now" flow
        const product = await prisma.product.findUnique({
          where: { id: directProductId },
        });
        if (!product) {
          return res.status(404).json({ error: 'Selected product not found' });
        }
        if (product.stock < directQuantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
          });
        }
        itemsToOrder.push({
          product,
          quantity: directQuantity,
          price: product.price,
          total: product.price * directQuantity,
        });
      } else {
        // From user's Cart
        const cart = await getUserCart(req.user!.id);
        if (cart.items.length === 0) {
          return res.status(400).json({ error: 'Your basket is empty' });
        }

        for (const item of cart.items) {
          if (item.product.stock < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} in stock.`,
            });
          }
          itemsToOrder.push({
            product: item.product,
            quantity: item.quantity,
            price: item.product.price, // Server price from DB
            total: item.product.price * item.quantity,
          });
        }
      }

      // Calculate total strictly on the server
      const subtotal = itemsToOrder.reduce((sum, item) => sum + item.total, 0);
      const totalAmount = subtotal;

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      // Execute transaction: create order, create order items, decrement stock, clear cart
      const order = await prisma.$transaction(async (tx) => {
        // 1. Create order
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: req.user!.id,
            status: 'pending',
            subtotal,
            totalAmount,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            city,
            country,
            postalCode,
            paymentMethodId: paymentMethodId || null,
          },
        });

        // 2. Create order items & decrement stock
        for (const item of itemsToOrder) {
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              productId: item.product.id,
              productName: item.product.name,
              productPrice: item.price,
              quantity: item.quantity,
              total: item.total,
            },
          });

          await tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 3. If cart order, clear user's cart
        if (!directProductId) {
          const userCart = await tx.cart.findUnique({
            where: { userId: req.user!.id },
          });
          if (userCart) {
            await tx.cartItem.deleteMany({
              where: { cartId: userCart.id },
            });
          }
        }

        return createdOrder;
      });

      return res.status(201).json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
      });
    } catch (err) {
      console.error('[Checkout Error]:', err);
      return res.status(500).json({ error: 'Checkout processing failed' });
    }
  });

  // Get customer's orders
  app.get('/api/orders', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return res.json({ orders });
    } catch (err) {
      console.error('[Orders Fetch Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Get single order details
  app.get('/api/orders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: true,
          paymentMethod: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Security check: only order owner or admin can view
      if (order.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access to this order is restricted' });
      }

      return res.json({ order });
    } catch (err) {
      console.error('[Order Details Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch order details' });
    }
  });

  // ==========================================
  // PAYMENT METHODS
  // ==========================================

  app.get('/api/payment-methods', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const methods = await prisma.paymentMethod.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ paymentMethods: methods });
    } catch (err) {
      console.error('[Payment Methods Fetch Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });

  app.post('/api/payment-methods', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = paymentMethodSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid card details' });
      }

      const { type, provider, last4, expMonth, expYear, isDefault } = parsed.data;

      if (isDefault) {
        await prisma.paymentMethod.updateMany({
          where: { userId: req.user!.id },
          data: { isDefault: false },
        });
      }

      const method = await prisma.paymentMethod.create({
        data: {
          userId: req.user!.id,
          type,
          provider,
          last4,
          expMonth,
          expYear,
          isDefault,
        },
      });

      return res.status(201).json({ paymentMethod: method });
    } catch (err) {
      console.error('[Payment Method Create Error]:', err);
      return res.status(500).json({ error: 'Failed to save payment method' });
    }
  });

  app.delete('/api/payment-methods/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const method = await prisma.paymentMethod.findUnique({
        where: { id: req.params.id },
      });

      if (!method || method.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Payment method not found' });
      }

      await prisma.paymentMethod.delete({ where: { id: req.params.id } });
      return res.json({ success: true });
    } catch (err) {
      console.error('[Payment Method Delete Error]:', err);
      return res.status(500).json({ error: 'Failed to delete payment method' });
    }
  });

  // ==========================================
  // IMAGE UPLOAD (LOCAL STORAGE ABSTRACTION)
  // ==========================================

  app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const blob = await put(safeName, req.file.buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return res.json({ url: blob.url });
      }

      fs.writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);
      return res.json({ url: `/uploads/${safeName}` });
    } catch (err) {
      console.error('[Upload Error]:', err);
      return res.status(500).json({ error: 'Failed to process file upload' });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD & MANAGEMENT (Protected)
  // ==========================================

  // Overview stats
  app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
    try {
      const [
        totalProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        lowStockProducts,
        orders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.user.count({ where: { role: 'user' } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.product.count({ where: { stock: { lte: 5 } } }),
        prisma.order.findMany({
          select: { totalAmount: true, status: true },
        }),
      ]);

      const totalRevenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });

      return res.json({
        totalProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        lowStockProducts,
        totalRevenue,
        recentOrders,
      });
    } catch (err) {
      console.error('[Admin Stats Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Admin Products CRUD
  app.get('/api/admin/products', requireAdmin, async (_req, res) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: true,
          _count: { select: { orderItems: true } },
        },
      });
      return res.json({ products });
    } catch (err) {
      console.error('[Admin Products Error]:', err);
      return res.status(500).json({ error: 'Failed to load products' });
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req, res) => {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid product payload' });
      }

      const { name, description, price, stock, categoryId, images } = parsed.data;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          stock,
          categoryId,
          images: {
            create: images.map((url, index) => ({
              url,
              isPrimary: index === 0,
            })),
          },
        },
        include: {
          category: true,
          images: true,
        },
      });

      return res.status(201).json({ product });
    } catch (err) {
      console.error('[Admin Create Product Error]:', err);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid product payload' });
      }

      const { name, description, price, stock, categoryId, images } = parsed.data;

      // Update product fields and replace images
      const product = await prisma.$transaction(async (tx) => {
        if (images && images.length > 0) {
          await tx.productImage.deleteMany({
            where: { productId: req.params.id },
          });

          await tx.productImage.createMany({
            data: images.map((url, index) => ({
              productId: req.params.id,
              url,
              isPrimary: index === 0,
            })),
          });
        }

        return tx.product.update({
          where: { id: req.params.id },
          data: {
            name,
            description,
            price,
            stock,
            categoryId,
          },
          include: {
            category: true,
            images: true,
          },
        });
      });

      return res.json({ product });
    } catch (err) {
      console.error('[Admin Update Product Error]:', err);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      // Check if product is in existing orders
      const orderItemCount = await prisma.orderItem.count({
        where: { productId: req.params.id },
      });

      if (orderItemCount > 0) {
        // Rather than breaking past orders, set stock to 0 or archive
        await prisma.product.update({
          where: { id: req.params.id },
          data: { stock: 0 },
        });
        return res.json({
          message: 'Product is referenced in existing customer orders. Stock set to 0 to prevent further sales.',
        });
      }

      await prisma.product.delete({
        where: { id: req.params.id },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('[Admin Delete Product Error]:', err);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Admin Categories CRUD
  app.get('/api/admin/categories', requireAdmin, async (_req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      });
      return res.json({ categories });
    } catch (err) {
      console.error('[Admin Categories Error]:', err);
      return res.status(500).json({ error: 'Failed to load categories' });
    }
  });

  app.post('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category payload' });
      }

      const { name, slug, description, image } = parsed.data;

      const existing = await prisma.category.findFirst({
        where: {
          OR: [{ slug }, { name }],
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Category with this name or slug already exists' });
      }

      const category = await prisma.category.create({
        data: { name, slug, description: description || null, image: image || null },
      });

      return res.status(201).json({ category });
    } catch (err) {
      console.error('[Admin Create Category Error]:', err);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category payload' });
      }

      const { name, slug, description, image } = parsed.data;

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data: { name, slug, description: description || null, image: image || null },
      });

      return res.json({ category });
    } catch (err) {
      console.error('[Admin Update Category Error]:', err);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      // Prevent invalid deletion if category has products
      const count = await prisma.product.count({
        where: { categoryId: req.params.id },
      });

      if (count > 0) {
        return res.status(400).json({
          error: `Cannot delete category: ${count} product(s) currently belong to it. Reassign or delete those products first.`,
        });
      }

      await prisma.category.delete({
        where: { id: req.params.id },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('[Admin Delete Category Error]:', err);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Admin Users Management
  app.get('/api/admin/users', requireAdmin, async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: 'user' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      });
      return res.json({ users });
    } catch (err) {
      console.error('[Admin Users Error]:', err);
      return res.status(500).json({ error: 'Failed to fetch customer users' });
    }
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid user data' });
      }

      const { name, email, password, phone, address, city, country, postalCode } = parsed.data;

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          postalCode: postalCode || null,
          role: 'user',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ user });
    } catch (err) {
      console.error('[Admin Create User Error]:', err);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const { name, phone, address, city, country, postalCode } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { name, phone, address, city, country, postalCode },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
        },
      });
      return res.json({ user });
    } catch (err) {
      console.error('[Admin Update User Error]:', err);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      await prisma.user.delete({
        where: { id: req.params.id },
      });
      return res.json({ success: true });
    } catch (err) {
      console.error('[Admin Delete User Error]:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Admin Administrator Accounts Management
  app.get('/api/admin/admins', requireAdmin, async (_req, res) => {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      return res.json({ admins });
    } catch (err) {
      console.error('[Admin List Admins Error]:', err);
      return res.status(500).json({ error: 'Failed to list administrators' });
    }
  });

  app.post('/api/admin/admins', requireAdmin, async (req, res) => {
    try {
      const parsed = adminCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid administrator payload' });
      }

      const { name, email, password } = parsed.data;

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await hashPassword(password);
      const admin = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: 'admin',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ admin });
    } catch (err) {
      console.error('[Admin Create Admin Error]:', err);
      return res.status(500).json({ error: 'Failed to create administrator' });
    }
  });

  app.put('/api/admin/admins/:id', requireAdmin, async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const data: any = {};
      if (name) data.name = name;
      if (email) data.email = email.toLowerCase();
      if (password && password.length >= 8) {
        data.passwordHash = await hashPassword(password);
      }

      const admin = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.json({ admin });
    } catch (err) {
      console.error('[Admin Update Admin Error]:', err);
      return res.status(500).json({ error: 'Failed to update administrator' });
    }
  });

  app.delete('/api/admin/admins/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Safety check: Prevent deleting the last administrator account
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Action prohibited: Cannot delete the last administrator account in the system.',
        });
      }

      if (req.user!.id === req.params.id) {
        return res.status(400).json({
          error: 'You cannot delete your own administrator account while logged in.',
        });
      }

      await prisma.user.delete({
        where: { id: req.params.id },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('[Admin Delete Admin Error]:', err);
      return res.status(500).json({ error: 'Failed to delete administrator' });
    }
  });

  // Admin Orders Management
  app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;

      const where: any = {};
      if (status && typeof status === 'string' && status !== 'all') {
        where.status = status;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        where.OR = [
          { orderNumber: { contains: q } },
          { customerName: { contains: q } },
          { customerEmail: { contains: q } },
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          paymentMethod: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return res.json({ orders });
    } catch (err) {
      console.error('[Admin Orders Error]:', err);
      return res.status(500).json({ error: 'Failed to load orders' });
    }
  });

  // Admin update order status
  app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
      });

      return res.json({ order });
    } catch (err) {
      console.error('[Admin Update Order Status Error]:', err);
      return res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  return app;
}

async function runLocalServer() {
  const app = await createApp();
  const PORT = 3000;

  // ==========================================
  // VITE DEV MIDDLEWARE OR PRODUCTION SERVE
  // ==========================================
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Atelier Commerce] Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  runLocalServer();
}

export { createApp };
