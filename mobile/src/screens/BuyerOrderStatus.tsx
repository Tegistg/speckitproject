import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import OrderStatusBadge from '../components/OrderStatusBadge';
import * as orderService from '../services/orderService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuyerOrderStatus'>;
  route: RouteProp<RootStackParamList, 'BuyerOrderStatus'>;
};

export default function BuyerOrderStatus({ route }: Props): React.JSX.Element {
  const { orderId } = route.params;
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId),
    refetchInterval: 15_000,
  });

  const { mutate: cancelOrder, isPending: cancelling } = useMutation({
    mutationFn: () => orderService.transitionStatus(orderId, 'cancelled', { cancel_reason: 'buyer_changed_mind' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const { mutate: markDone, isPending: completing } = useMutation({
    mutationFn: () => orderService.transitionStatus(orderId, 'completed'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (isLoading || !order) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const total = (order.totalAmountCents / 100).toFixed(2);
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canMarkDone = order.status === 'ready_for_pickup';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Your Order</Text>
      <Text style={styles.listingTitle}>{order.listing?.title ?? 'Snack'}</Text>
      <Text style={styles.total}>${total}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <OrderStatusBadge status={order.status as never} />
      </View>

      {order.pickupLocation && (
        <View style={styles.section}>
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={styles.value}>{order.pickupLocation}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Payment</Text>
        <Text style={styles.value}>
          {order.paymentMethod === 'cash' ? 'Cash on pickup' : 'Online payment'}
        </Text>
      </View>

      {canMarkDone && (
        <TouchableOpacity
          style={[styles.actionButton, styles.doneButton, completing && styles.disabled]}
          onPress={() => markDone()}
          disabled={completing}
        >
          <Text style={styles.actionButtonText}>I've Picked It Up</Text>
        </TouchableOpacity>
      )}

      {canCancel && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton, cancelling && styles.disabled]}
          onPress={() => Alert.alert('Cancel Order?', 'Are you sure?', [
            { text: 'No' },
            { text: 'Yes, Cancel', onPress: () => cancelOrder(), style: 'destructive' },
          ])}
          disabled={cancelling}
        >
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  listingTitle: { fontSize: 16, color: '#374151', marginBottom: 4 },
  total: { fontSize: 26, fontWeight: '800', color: '#2563eb', marginBottom: 24 },
  section: { marginBottom: 20 },
  label: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 6 },
  value: { fontSize: 15, color: '#111827' },
  actionButton: { borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  doneButton: { backgroundColor: '#2563eb' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444' },
  actionButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.5 },
});
