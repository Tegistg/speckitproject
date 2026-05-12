import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import OrderStatusBadge from '../components/OrderStatusBadge';
import * as orderService from '../services/orderService';
import type { Order } from '../services/orderService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SellerOrderList'>;
};

export default function SellerOrderList({ navigation }: Props): React.JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => orderService.getMyOrders({ role: 'seller' }),
    refetchInterval: 30_000,
  });

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const orders = data?.data ?? [];

  return (
    <FlatList<Order>
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('OrderActions', { orderId: item.id })}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.listing?.title ?? 'Order'}</Text>
            <Text style={styles.itemMeta}>${(item.totalAmountCents / 100).toFixed(2)} · {item.paymentMethod}</Text>
          </View>
          <OrderStatusBadge status={item.status as never} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No incoming orders yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, padding: 16 },
});
