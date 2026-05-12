import { Listing, ListingCategory, ListingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ListingFeedParams {
  cursor?: string;
  limit?: number;
  q?: string;
  category?: ListingCategory;
  minPriceCents?: number;
  maxPriceCents?: number;
}

export interface ListingFeedResult {
  data: Listing[];
  nextCursor: string | null;
}

export async function getFeed(params: ListingFeedParams): Promise<ListingFeedResult> {
  const limit = Math.min(params.limit ?? 20, 50);

  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.active,
    ...(params.category && { category: params.category }),
    ...(params.minPriceCents !== undefined && { priceCents: { gte: params.minPriceCents } }),
    ...(params.maxPriceCents !== undefined && {
      priceCents: {
        ...(params.minPriceCents !== undefined ? { gte: params.minPriceCents } : {}),
        lte: params.maxPriceCents,
      },
    }),
    ...(params.q && {
      OR: [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ],
    }),
    ...(params.cursor && { id: { gt: params.cursor } }),
  };

  const listings = await prisma.listing.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, avgRating: true } } },
  });

  const hasMore = listings.length > limit;
  const data = hasMore ? listings.slice(0, limit) : listings;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor };
}

export async function getById(id: string): Promise<Listing | null> {
  return prisma.listing.findFirst({
    where: { id, status: { not: ListingStatus.removed } },
    include: { seller: { select: { id: true, name: true, avgRating: true } } },
  });
}

export async function createListing(
  sellerId: string,
  data: {
    title: string;
    description?: string;
    priceCents: number;
    quantity: number;
    category: ListingCategory;
    acceptedPaymentMethods?: string[];
  },
): Promise<Listing> {
  const status = data.quantity === 0 ? ListingStatus.sold_out : ListingStatus.active;
  return prisma.listing.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description,
      priceCents: data.priceCents,
      quantity: data.quantity,
      category: data.category,
      status,
      acceptedPaymentMethods: data.acceptedPaymentMethods ?? ['cash', 'stripe'],
    },
  });
}

export async function updateListing(
  id: string,
  sellerId: string,
  data: Partial<{
    title: string;
    description: string;
    priceCents: number;
    quantity: number;
    category: ListingCategory;
    acceptedPaymentMethods: string[];
  }>,
): Promise<Listing> {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
  if (listing.sellerId !== sellerId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  const updates: Prisma.ListingUpdateInput = { ...data };
  if (data.quantity !== undefined) {
    updates.status = data.quantity === 0 ? ListingStatus.sold_out : ListingStatus.active;
  }

  return prisma.listing.update({ where: { id }, data: updates });
}

export async function removeListing(id: string, sellerId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
  if (listing.sellerId !== sellerId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });

  await prisma.$transaction([
    prisma.order.updateMany({
      where: { listingId: id, status: 'pending' },
      data: { status: 'cancelled', cancelReason: 'listing_removed' },
    }),
    prisma.listing.update({ where: { id }, data: { status: ListingStatus.removed } }),
  ]);
}

export async function updatePhoto(id: string, sellerId: string, photoUrl: string): Promise<Listing> {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
  if (listing.sellerId !== sellerId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  return prisma.listing.update({ where: { id }, data: { photoUrl } });
}
