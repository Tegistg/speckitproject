import { Rating } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function submitRating(
  raterId: string,
  orderId: string,
  stars: number,
  comment?: string,
): Promise<Rating> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (order.status !== 'completed') {
    throw Object.assign(new Error('Ratings can only be submitted for completed orders'), { statusCode: 422 });
  }
  if (order.buyerId !== raterId && order.sellerId !== raterId) {
    throw Object.assign(new Error('You are not a party to this order'), { statusCode: 422 });
  }

  const rateeId = order.buyerId === raterId ? order.sellerId : order.buyerId;

  const rating = await prisma.rating.create({
    data: { orderId, raterId, rateeId, stars, comment },
  });

  // Recompute avg_rating for ratee
  const agg = await prisma.rating.aggregate({
    where: { rateeId },
    _avg: { stars: true },
    _count: { stars: true },
  });
  await prisma.user.update({
    where: { id: rateeId },
    data: { avgRating: agg._avg.stars ?? undefined },
  });

  return rating;
}

export async function getUserRatings(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ avgRating: number | null; totalCount: number; data: Rating[]; nextCursor: string | null }> {
  const take = Math.min(limit, 50);
  const where = { rateeId: userId, ...(cursor && { id: { gt: cursor } }) };

  const [ratings, user] = await Promise.all([
    prisma.rating.findMany({
      where,
      take: take + 1,
      orderBy: { createdAt: 'desc' },
      include: { rater: { select: { id: true, name: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { avgRating: true } }),
  ]);

  const totalCount = await prisma.rating.count({ where: { rateeId: userId } });
  const hasMore = ratings.length > take;
  const data = hasMore ? ratings.slice(0, take) : ratings;

  return {
    avgRating: user?.avgRating ? Number(user.avgRating) : null,
    totalCount,
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
  };
}
