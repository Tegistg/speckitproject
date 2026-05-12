import { apiFetch } from './apiClient';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantityOrdered: number;
  unitPriceCents: number;
  totalAmountCents: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  pickupLocation?: string;
  cancelReason?: string;
  disputeReason?: string;
  disputeNote?: string;
  autoCancelAt: string;
  createdAt: string;
  updatedAt: string;
  listing?: { id: string; title: string; photoUrl?: string };
  buyer?: { id: string; name: string; avgRating: number | null };
  seller?: { id: string; name: string; avgRating: number | null };
}

export async function placeOrder(data: {
  listing_id: string;
  quantity_ordered: number;
  payment_method: 'cash' | 'stripe';
  stripe_payment_method_id?: string;
}): Promise<Order> {
  return apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

export async function transitionStatus(
  id: string,
  status: string,
  extra?: {
    pickup_location?: string;
    cancel_reason?: string;
    dispute_reason?: string;
    dispute_note?: string;
  },
): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extra }),
  });
}

export async function getMyOrders(params?: {
  role?: 'buyer' | 'seller';
  status?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ data: Order[]; next_cursor: string | null }> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/users/me/orders${qs ? `?${qs}` : ''}`);
}
