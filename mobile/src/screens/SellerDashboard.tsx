import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as listingService from '../services/listingService';
import type { Listing } from '../services/listingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SellerDashboard'>;
};

export default function SellerDashboard({ navigation }: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => listingService.getFeed(),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const listings = data?.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Listings</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateListing')}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Listing>
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                ${(item.priceCents / 100).toFixed(2)} · Qty: {item.quantity} · {item.status}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => navigation.navigate('EditListing', { listingId: item.id })}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Remove Listing?', 'This will cancel all pending orders.', [
                { text: 'Cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => remove(item.id) },
              ])}>
                <Text style={styles.removeBtn}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No listings yet. Tap "+ New" to create one.</Text>}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate('SellerOrderList')}>
        <Text style={styles.ordersButtonText}>View Incoming Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: '700' },
  addButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  list: { padding: 16 },
  item: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  itemActions: { flexDirection: 'row', gap: 12 },
  editBtn: { color: '#2563eb', fontWeight: '600' },
  removeBtn: { color: '#ef4444', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  ordersButton: { margin: 16, backgroundColor: '#fff', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#2563eb' },
  ordersButtonText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
});
