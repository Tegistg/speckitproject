import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type OrderStatus = 'pending' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled' | 'disputed';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:          { label: 'Pending',          color: '#92400e', bg: '#fef3c7' },
  confirmed:        { label: 'Confirmed',        color: '#065f46', bg: '#d1fae5' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#1e40af', bg: '#dbeafe' },
  completed:        { label: 'Completed',        color: '#374151', bg: '#f3f4f6' },
  cancelled:        { label: 'Cancelled',        color: '#991b1b', bg: '#fee2e2' },
  disputed:         { label: 'Disputed',         color: '#7c3aed', bg: '#ede9fe' },
};

interface Props {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: Props): React.JSX.Element {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#374151', bg: '#f3f4f6' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '600' },
});
