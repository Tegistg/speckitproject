import { Order, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/expoPush';
import { capturePaymentIntent, voidPaymentIntent, refundPaymentIntent } from '../lib/stripe';

const AUTO_CANCEL_MINUTES = 30;

export async function createOrder(
  buyerId: string,
  data: {
    listingId: string;
    quantityOrdered: number;
    paymentMethod: PaymentMethod;
    stripePaymentIntentId?: string;
  },
): Promise<Order> {
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { seller: true },
  });

  if (!listing || listing.status === 'removed') {
    throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
  }
  if (listing.sellerId === buyerId) {
    throw Object.assign(new Error('You cannot purchase your own listing'), { statusCode: 422 });
  }
  if (!listing.acceptedPaymentMethods.includes(data.paymentMethod)) {
    throw Object.assign(new Error('Payment method not accepted by seller'), { statusCode: 422 });
  }

  const autoCancelAt = new Date(Date.now() + AUTO_CANCEL_MINUTES * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.listing.updateMany({
      where: { id: data.listingId, quantity: { gt: 0 } },
      data: { quantity: { decrement: data.quantityOrdered } },
    });

    if (updated.count === 0) {
      throw Object.assign(new Error('Item is sold out'), { statusCode: 409 });
    }

    // Set sold_out if quantity reaches 0
    await tx.listing.updateMany({
      where: { id: data.listingId, quantity: 0 },
      data: { status: 'sold_out' },
    });

    return tx.order.create({
      data: {
        listingId: data.listingId,
        buyerId,
        sellerId: listing.sellerId,
        quantityOrdered: data.quantityOrdered,
        unitPriceCents: listing.priceCents,
        totalAmountCents: listing.priceCents * data.quantityOrdered,
        paymentMethod: data.paymentMethod,
        paymentStatus:
          data.paymentMethod === PaymentMethod.stripe
            ? PaymentStatus.authorized
            : PaymentStatus.not_applicable,
        stripePaymentIntentId: data.stripePaymentIntentId,
        autoCancelAt,
      },
    });
  });

  // Notify seller
  if (listing.seller.expoPushToken) {
    await sendPushNotification(
      listing.seller.expoPushToken,
      'New Order!',
      `Someone ordered your "${listing.title}"`,
      { orderId: order.id },
    );
  }

  return order;
}

export async function getOrderById(id: string, userId: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, avgRating: true } },
      seller: { select: { id: true, name: true, avgRating: true } },
    },
  });

  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
  return order;
}

export async function transitionStatus(
  orderId: string,
  userId: string,
  newStatus: OrderStatus,
  extra?: {
    pickupLocation?: string;
    cancelReason?: string;
    disputeReason?: string;
    disputeNote?: string;
  },
): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { expoPushToken: true, name: true } },
      seller: { select: { expoPushToken: true, name: true } },
      listing: { select: { title: true } },
    },
  });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  const isBuyer = order.buyerId === userId;
  const isSeller = order.sellerId === userId;
  if (!isBuyer && !isSeller) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  validateTransition(order.status, newStatus, isSeller, isBuyer);

  const updateData: Prisma.OrderUpdateInput = { status: newStatus };

  if (newStatus === OrderStatus.confirmed) {
    if (extra?.pickupLocation) updateData.pickupLocation = extra.pickupLocation;
    if (order.paymentMethod === PaymentMethod.stripe && order.stripePaymentIntentId) {
      await capturePaymentIntent(order.stripePaymentIntentId);
      updateData.paymentStatus = PaymentStatus.captured;
    }
  }

  if (newStatus === OrderStatus.cancelled) {
    if (extra?.cancelReason) updateData.cancelReason = extra.cancelReason as never;
    if (order.paymentMethod === PaymentMethod.stripe && order.stripePaymentIntentId) {
      if (order.paymentStatus === PaymentStatus.captured) {
        await refundPaymentIntent(order.stripePaymentIntentId);
        updateData.paymentStatus = PaymentStatus.refunded;
      } else {
        await voidPaymentIntent(order.stripePaymentIntentId);
        updateData.paymentStatus = PaymentStatus.voided;
      }
    }
  }

  if (newStatus === OrderStatus.disputed) {
    if (extra?.disputeReason) updateData.disputeReason = extra.disputeReason as never;
    if (extra?.disputeNote) updateData.disputeNote = extra.disputeNote;
  }

  if (newStatus === OrderStatus.completed) {
    if (isBuyer) updateData.buyerCompletedAt = new Date();
    if (isSeller) updateData.sellerCompletedAt = new Date();

    const current = await prisma.order.findUnique({ where: { id: orderId } });
    const bothDone =
      (isBuyer && current?.sellerCompletedAt) || (isSeller && current?.buyerCompletedAt);

    if (!bothDone) {
      return prisma.order.update({ where: { id: orderId }, data: updateData });
    }

    await prisma.user.updateMany({
      where: { id: { in: [order.buyerId, order.sellerId] } },
      data: { completedTransactionCount: { increment: 1 } },
    });
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data: updateData });

  await sendStatusPushNotifications(order, newStatus, isSeller);

  return updated;
}

function validateTransition(
  current: OrderStatus,
  next: OrderStatus,
  isSeller: boolean,
  isBuyer: boolean,
): void {
  const terminal = [OrderStatus.completed, OrderStatus.cancelled];
  if (terminal.includes(current)) {
    throw Object.assign(new Error(`Order is already ${current}`), { statusCode: 409 });
  }

  const allowed: Partial<Record<OrderStatus, { next: OrderStatus[]; role: 'seller' | 'buyer' | 'both' }[]>> = {
    [OrderStatus.pending]: [
      { next: [OrderStatus.confirmed, OrderStatus.cancelled], role: 'seller' },
      { next: [OrderStatus.cancelled, OrderStatus.disputed], role: 'buyer' },
    ],
    [OrderStatus.confirmed]: [
      { next: [OrderStatus.ready_for_pickup], role: 'seller' },
      { next: [OrderStatus.disputed], role: 'both' },
    ],
    [OrderStatus.ready_for_pickup]: [
      { next: [OrderStatus.completed, OrderStatus.disputed], role: 'both' },
    ],
  };

  const rules = allowed[current] ?? [];
  const permitted = rules.some(
    (r) =>
      r.next.includes(next) &&
      (r.role === 'both' || (r.role === 'seller' && isSeller) || (r.role === 'buyer' && isBuyer)),
  );

  if (!permitted) {
    throw Object.assign(
      new Error(`Cannot transition from ${current} to ${next}`),
      { statusCode: 409 },
    );
  }
}

async function sendStatusPushNotifications(
  order: { buyerId: string; sellerId: string; buyer: { expoPushToken: string | null }; seller: { expoPushToken: string | null }; listing: { title: string } },
  newStatus: OrderStatus,
  isSeller: boolean,
): Promise<void> {
  const title = order.listing.title;
  const buyerToken = order.buyer.expoPushToken;
  const sellerToken = order.seller.expoPushToken;

  switch (newStatus) {
    case OrderStatus.confirmed:
      if (buyerToken) await sendPushNotification(buyerToken, 'Order Confirmed!', `Your order for "${title}" was confirmed`, { orderId: order.buyerId });
      break;
    case OrderStatus.cancelled:
      if (isSeller && buyerToken) await sendPushNotification(buyerToken, 'Order Cancelled', `Your order for "${title}" was cancelled`, {});
      if (!isSeller && sellerToken) await sendPushNotification(sellerToken, 'Order Cancelled', `A buyer cancelled their order for "${title}"`, {});
      break;
    case OrderStatus.ready_for_pickup:
      if (buyerToken) await sendPushNotification(buyerToken, 'Ready for Pickup!', `Your "${title}" is ready — go pick it up!`, {});
      break;
    case OrderStatus.completed:
      if (buyerToken) await sendPushNotification(buyerToken, 'Order Complete', `Leave a rating for your "${title}" transaction`, {});
      if (sellerToken) await sendPushNotification(sellerToken, 'Order Complete', `Rate your buyer for the "${title}" transaction`, {});
      break;
  }
}

export async function listOrders(
  userId: string,
  role?: 'buyer' | 'seller',
  status?: OrderStatus,
  cursor?: string,
  limit = 20,
): Promise<{ data: Order[]; nextCursor: string | null }> {
  const take = Math.min(limit, 50);
  const where: Prisma.OrderWhereInput = {
    ...(role === 'buyer' && { buyerId: userId }),
    ...(role === 'seller' && { sellerId: userId }),
    ...(!role && { OR: [{ buyerId: userId }, { sellerId: userId }] }),
    ...(status && { status }),
    ...(cursor && { id: { gt: cursor } }),
  };

  const orders = await prisma.order.findMany({
    where,
    take: take + 1,
    orderBy: { createdAt: 'desc' },
    include: { listing: { select: { id: true, title: true, photoUrl: true } } },
  });

  const hasMore = orders.length > take;
  const data = hasMore ? orders.slice(0, take) : orders;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}
