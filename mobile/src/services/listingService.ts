import { apiFetch } from './apiClient';

export interface Listing {
  id: string;
  title: string;
  description?: string;
  priceCents: number;
  quantity: number;
  category: string;
  status: string;
  photoUrl?: string;
  acceptedPaymentMethods: string[];
  seller: { id: string; name: string; avgRating: number | null };
  createdAt: string;
  updatedAt: string;
}

export interface ListingFeedResponse {
  data: Listing[];
  next_cursor: string | null;
}

export async function getFeed(params?: {
  cursor?: string;
  limit?: number;
  q?: string;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
}): Promise<ListingFeedResponse> {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', params.category);
  if (params?.minPriceCents !== undefined) query.set('min_price_cents', String(params.minPriceCents));
  if (params?.maxPriceCents !== undefined) query.set('max_price_cents', String(params.maxPriceCents));
  const qs = query.toString();
  return apiFetch<ListingFeedResponse>(`/listings${qs ? `?${qs}` : ''}`);
}

export async function getById(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`);
}

export async function createListing(data: {
  title: string;
  description?: string;
  priceCents: number;
  quantity: number;
  category: string;
  acceptedPaymentMethods?: string[];
}): Promise<Listing> {
  return apiFetch<Listing>('/listings', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateListing(id: string, data: Partial<{
  title: string;
  description: string;
  priceCents: number;
  quantity: number;
  category: string;
  acceptedPaymentMethods: string[];
}>): Promise<Listing> {
  return apiFetch<Listing>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteListing(id: string): Promise<void> {
  return apiFetch<void>(`/listings/${id}`, { method: 'DELETE' });
}
