import { prisma } from './db';
import { hashPassword } from './auth';

export async function seedDatabase() {
  const adminEmail = 'admin@atelier.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log('[Seed] Creating initial administrator account...');
    const adminPasswordHash = await hashPassword('AdminPassword123!');
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        name: 'Atelier Lead Curator',
        role: 'admin',
      },
    });
    console.log('[Seed] Initial administrator created: admin@atelier.com / AdminPassword123!');
  }

  const customerEmail = 'customer@atelier.com';
  let customer = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!customer) {
    console.log('[Seed] Creating initial customer account...');
    const customerPasswordHash = await hashPassword('CustomerPassword123!');
    customer = await prisma.user.create({
      data: {
        email: customerEmail,
        passwordHash: customerPasswordHash,
        name: 'Clara O’Neill',
        phone: '+1 (503) 555-0199',
        address: '742 Evergreen Terrace',
        city: 'Portland',
        country: 'United States',
        postalCode: '97201',
        role: 'user',
      },
    });

    // Seed customer payment method
    await prisma.paymentMethod.create({
      data: {
        userId: customer.id,
        type: 'card',
        provider: 'Visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
        isDefault: true,
      },
    });
  }

  // Categories
  const categoriesData = [
    {
      name: 'Ceramics & Homeware',
      slug: 'ceramics',
      description: 'Wheel-thrown and hand-pinched stoneware glazed with natural minerals and ash.',
    },
    {
      name: 'Textiles & Linen',
      slug: 'textiles',
      description: 'Stone-washed European flax linens woven for tactile comfort and enduring softness.',
    },
    {
      name: 'Brushed Brassware',
      slug: 'brassware',
      description: 'Solid machined and cast brass objects designed to patina with daily touch.',
    },
    {
      name: 'Artisanal Leather',
      slug: 'leather-goods',
      description: 'Full-grain vegetable tanned bridle leather stitched by master saddlers.',
    },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    categoryMap[cat.slug] = record.id;
  }

  // Initial Products
  const productsData = [
    {
      name: 'Stoneware Ceramic Vessel',
      slugCategory: 'ceramics',
      description: 'Hand-thrown on a foot-powered wheel from dense stoneware clay. Features a dual chalk-white and raw terracotta mineral glaze. Designed for floral stems or singular sculptural display.',
      price: 148.0,
      stock: 18,
      image: '/src/assets/images/product_ceramic_vessel_1790242838659.jpg',
    },
    {
      name: 'Belgian Washed Linen Throw',
      slugCategory: 'textiles',
      description: 'Spun from 100% Belgian flax and pre-washed with river stones for relaxed drape. Finished with raw fringed edges and warm oat natural tone.',
      price: 210.0,
      stock: 14,
      image: '/src/assets/images/product_linen_throw_1790242850128.jpg',
    },
    {
      name: 'Solid Sculptural Brass Candlestick',
      slugCategory: 'brassware',
      description: 'Machined from solid brass billet with architectural step geometry. Uncoated surface intended to record fingerprints and ambient atmosphere over decades.',
      price: 95.0,
      stock: 24,
      image: '/src/assets/images/product_brass_candlestick_1790242860861.jpg',
    },
    {
      name: 'Vegetable-Tanned Leather Tote',
      slugCategory: 'leather-goods',
      description: 'Cut from full-grain Tuscan vegetable-tanned steer hide. Stitched by hand with waxed linen cord. Deep espresso brown that softens gracefully with wear.',
      price: 380.0,
      stock: 8,
      image: '/src/assets/images/product_leather_tote_1790242873089.jpg',
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          stock: prod.stock,
          categoryId: categoryMap[prod.slugCategory],
          images: {
            create: [
              {
                url: prod.image,
                isPrimary: true,
              },
            ],
          },
        },
      });

      // If customer exists and no orders yet, seed a sample completed order
      const orderCount = await prisma.order.count();
      if (orderCount === 0 && customer) {
        await prisma.order.create({
          data: {
            orderNumber: 'ORD-84910',
            userId: customer.id,
            status: 'delivered',
            subtotal: prod.price,
            totalAmount: prod.price,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingAddress: customer.address || '742 Evergreen Terrace',
            city: customer.city || 'Portland',
            country: customer.country || 'United States',
            postalCode: customer.postalCode || '97201',
            items: {
              create: [
                {
                  productId: created.id,
                  productName: created.name,
                  productPrice: created.price,
                  quantity: 1,
                  total: created.price,
                },
              ],
            },
          },
        });
      }
    }
  }

  console.log('[Seed] Database initialization complete.');
}
