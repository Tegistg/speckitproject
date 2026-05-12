import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/expoPush';
import { voidPaymentIntent } from '../lib/stripe';

export async function runOrderTimeoutCheck(): Promise<void> {
  const now = new Date();
  const warningThreshold = new Date(now.getTime() + 15 * 60 * 1000);

  // Send 15-min warning for orders approaching timeout
  const soonExpiring = await prisma.order.findMany({
    where: {
      status: OrderStatus.pending,
      autoCancelAt: { lte: warningThreshold },
      sellerTimeoutWarningSentAt: null,
    },
    include: { seller: { select: { expoPushToken: true } }, listing: { select: { title: true } } },
  });

  for (const order of soonExpiring) {
    if (order.seller.expoPushToken) {
      await sendPushNotification(
        order.seller.expoPushToken,
        'Order Expiring Soon!',
        `You have 15 minutes to confirm the order for "${order.listing.title}"`,
        { orderId: order.id },
      );
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { sellerTimeoutWarningSentAt: now },
    });
  }

  // Auto-cancel overdue pending orders
  const overdue = await prisma.order.findMany({
    where: { status: OrderStatus.pending, autoCancelAt: { lte: now } },
    include: {
      buyer: { select: { expoPushToken: true } },
      listing: { select: { title: true } },
    },
  });

  for (const order of overdue) {
    const updateData: Parameters<typeof prisma.order.update>[0]['data'] = {
      status: OrderStatus.cancelled,
      cancelReason: 'seller_timeout',
    };

    if (order.paymentMethod === PaymentMethod.stripe && order.stripePaymentIntentId) {
      if (order.paymentStatus === PaymentStatus.authorized) {
        await voidPaymentIntent(order.stripePaymentIntentId).catch(console.error);
        updateData.paymentStatus = PaymentStatus.voided;
      }
    }

    await prisma.order.update({ where: { id: order.id }, data: updateData });

    if (order.buyer.expoPushToken) {
      await sendPushNotification(
        order.buyer.expoPushToken,
        'Order Cancelled',
        `Your order for "${order.listing.title}" was cancelled — seller didn't respond in time`,
        {},
      );
    }
  }
}
