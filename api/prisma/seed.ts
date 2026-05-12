import { PrismaClient, ListingCategory, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  const [buyer, seller, admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'buyer@university.edu' },
      update: {},
      create: { id: 'seed-buyer-001', email: 'buyer@university.edu', name: 'Test Buyer' },
    }),
    prisma.user.upsert({
      where: { email: 'seller@university.edu' },
      update: {},
      create: { id: 'seed-seller-001', email: 'seller@university.edu', name: 'Test Seller', avgRating: 4.5, completedTransactionCount: 3 },
    }),
    prisma.user.upsert({
      where: { email: 'admin@university.edu' },
      update: {},
      create: { id: 'seed-admin-001', email: 'admin@university.edu', name: 'Admin User' },
    }),
  ]);

  console.log('Created users:', buyer.email, seller.email, admin.email);

  const listingsData = [
    { title: 'Spicy Chips', description: 'Extra hot tortilla chips', priceCents: 250, quantity: 5, category: ListingCategory.savory },
    { title: 'Chocolate Bar', description: 'Dark chocolate 70%', priceCents: 150, quantity: 3, category: ListingCategory.sweet },
    { title: 'Instant Ramen', description: 'Beef flavour, just add hot water', priceCents: 100, quantity: 10, category: ListingCategory.snacks },
    { title: 'Energy Drink', description: 'Keeps you going through finals', priceCents: 300, quantity: 4, category: ListingCategory.drinks },
    { title: 'Granola Bar', description: 'Oats and honey', priceCents: 175, quantity: 8, category: ListingCategory.snacks },
    { title: 'Popcorn', description: 'Buttered microwave popcorn', priceCents: 125, quantity: 6, category: ListingCategory.savory },
    { title: 'Gummy Bears', description: 'Assorted fruit flavours', priceCents: 200, quantity: 2, category: ListingCategory.sweet },
    { title: 'Sparkling Water', description: 'Lime flavoured', priceCents: 175, quantity: 7, category: ListingCategory.drinks },
    { title: 'Trail Mix', description: 'Nuts, raisins, and M&Ms', priceCents: 225, quantity: 3, category: ListingCategory.snacks },
    { title: 'Crackers', description: 'Whole wheat crackers', priceCents: 150, quantity: 0, category: ListingCategory.savory },
  ];

  const listings = await Promise.all(
    listingsData.map((l) =>
      prisma.listing.upsert({
        where: { id: `seed-listing-${l.title.toLowerCase().replace(/\s/g, '-')}` },
        update: {},
        create: {
          id: `seed-listing-${l.title.toLowerCase().replace(/\s/g, '-')}`,
          sellerId: seller.id,
          status: l.quantity === 0 ? 'sold_out' : 'active',
          ...l,
        },
      }),
    ),
  );

  console.log(`Created ${listings.length} listings`);

  const now = new Date();
  const futureCancel = new Date(now.getTime() + 30 * 60 * 1000);

  // Completed order with rating
  const completedOrder = await prisma.order.upsert({
    where: { id: 'seed-order-completed-001' },
    update: {},
    create: {
      id: 'seed-order-completed-001',
      listingId: listings[0].id,
      buyerId: buyer.id,
      sellerId: seller.id,
      quantityOrdered: 1,
      unitPriceCents: listings[0].priceCents,
      totalAmountCents: listings[0].priceCents,
      status: OrderStatus.completed,
      paymentMethod: PaymentMethod.cash,
      paymentStatus: PaymentStatus.not_applicable,
      autoCancelAt: futureCancel,
      pickupLocation: 'Room 204, Dorm A',
      buyerCompletedAt: now,
      sellerCompletedAt: now,
    },
  });

  await prisma.rating.upsert({
    where: { orderId_raterId: { orderId: completedOrder.id, raterId: buyer.id } },
    update: {},
    create: { orderId: completedOrder.id, raterId: buyer.id, rateeId: seller.id, stars: 5, comment: 'Great snack, fast pickup!' },
  });

  // Pending order
  await prisma.order.upsert({
    where: { id: 'seed-order-pending-001' },
    update: {},
    create: {
      id: 'seed-order-pending-001',
      listingId: listings[1].id,
      buyerId: buyer.id,
      sellerId: seller.id,
      quantityOrdered: 1,
      unitPriceCents: listings[1].priceCents,
      totalAmountCents: listings[1].priceCents,
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.cash,
      paymentStatus: PaymentStatus.not_applicable,
      autoCancelAt: futureCancel,
    },
  });

  await prisma.user.update({ where: { id: seller.id }, data: { avgRating: 5.0 } });

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
