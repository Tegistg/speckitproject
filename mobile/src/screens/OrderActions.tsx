import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import OrderStatusBadge from '../components/OrderStatusBadge';
import * as orderService from '../services/orderService';
import { useAuthStore } from '../store/authStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderActions'>;
  route: RouteProp<RootStackParamList, 'OrderActions'>;
};

export default function OrderActions({ route }: Props): React.JSX.Element {
  const { orderId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [pickupLocation, setPickupLocation] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId),
    refetchInterval: 15_000,
  });

  const { mutate: transition, isPending } = useMutation({
    mutationFn: (args: { status: string; extra?: Record<string, string> }) =>
      orderService.transitionStatus(orderId, args.status, args.extra),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (isLoading || !order) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const isSeller = user?.id === order.sellerId;
  const total = (order.totalAmountCents / 100).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{order.listing?.title ?? 'Order'}</Text>
      <Text style={styles.total}>${total}</Text>
      <OrderStatusBadge status={order.status as never} />

      {order.pickupLocation && (
        <View style={styles.section}>
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={styles.value}>{order.pickupLocation}</Text>
        </View>
      )}

      {isSeller && order.status === 'pending' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Pickup location (e.g. Room 204)"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
          <TouchableOpacity
            style={[styles.actionBtn, styles.confirmBtn, isPending && styles.disabled]}
            onPress={() => transition({ status: 'confirmed', extra: { pickup_location: pickupLocation } })}
            disabled={isPending}
          >
            <Text style={styles.actionBtnText}>Confirm Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn, isPending && styles.disabled]}
            onPress={() => Alert.alert('Reject Order?', '', [
              { text: 'Cancel' },
              { text: 'Reject', style: 'destructive', onPress: () => transition({ status: 'cancelled', extra: { cancel_reason: 'seller_rejected' } }) },
            ])}
            disabled={isPending}
          >
            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject Order</Text>
          </TouchableOpacity>
        </>
      )}

      {isSeller && order.status === 'confirmed' && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.confirmBtn, isPending && styles.disabled]}
          onPress={() => transition({ status: 'ready_for_pickup' })}
          disabled={isPending}
        >
          <Text style={styles.actionBtnText}>Mark as Ready for Pickup</Text>
        </TouchableOpacity>
      )}

      {order.status === 'ready_for_pickup' && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.confirmBtn, isPending && styles.disabled]}
          onPress={() => transition({ status: 'completed' })}
          disabled={isPending}
        >
          <Text style={styles.actionBtnText}>Mark as Done</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  total: { fontSize: 24, fontWeight: '800', color: '#2563eb', marginBottom: 12 },
  section: { marginTop: 16 },
  label: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginTop: 20, marginBottom: 12, fontSize: 15 },
  actionBtn: { borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  confirmBtn: { backgroundColor: '#2563eb' },
  rejectBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
