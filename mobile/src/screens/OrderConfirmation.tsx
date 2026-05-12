import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import * as listingService from '../services/listingService';
import * as orderService from '../services/orderService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;
  route: RouteProp<RootStackParamList, 'OrderConfirmation'>;
};

export default function OrderConfirmation({ navigation, route }: Props): React.JSX.Element {
  const { listingId } = route.params;
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash');
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getById(listingId),
  });

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () =>
      orderService.placeOrder({
        listing_id: listingId,
        quantity_ordered: 1,
        payment_method: paymentMethod,
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      navigation.replace('BuyerOrderStatus', { orderId: order.id });
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 409) {
        Alert.alert('Sold Out', 'Sorry, this item just sold out.');
        navigation.goBack();
      } else {
        Alert.alert('Error', err.message);
      }
    },
  });

  if (isLoading || !listing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  const price = (listing.priceCents / 100).toFixed(2);
  const acceptsCash = listing.acceptedPaymentMethods.includes('cash');
  const acceptsStripe = listing.acceptedPaymentMethods.includes('stripe');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Confirm Order</Text>
      <Text style={styles.listingTitle}>{listing.title}</Text>
      <Text style={styles.price}>${price}</Text>

      <Text style={styles.sectionLabel}>Payment Method</Text>
      <View style={styles.paymentRow}>
        {acceptsCash && (
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextSelected]}>
              Cash on Pickup
            </Text>
          </TouchableOpacity>
        )}
        {acceptsStripe && (
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'stripe' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('stripe')}
          >
            <Text style={[styles.paymentText, paymentMethod === 'stripe' && styles.paymentTextSelected]}>
              Pay Online
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>
        {paymentMethod === 'cash'
          ? 'You agree to pay cash when you pick up the snack.'
          : 'Your card will be authorized now and charged when the seller confirms.'}
      </Text>

      <TouchableOpacity
        style={[styles.confirmButton, isPending && styles.confirmButtonDisabled]}
        onPress={() => placeOrder()}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  listingTitle: { fontSize: 17, color: '#374151', marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '800', color: '#2563eb', marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  paymentRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  paymentOption: { flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  paymentSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  paymentText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  paymentTextSelected: { color: '#2563eb' },
  disclaimer: { fontSize: 13, color: '#6b7280', marginBottom: 32, lineHeight: 18 },
  confirmButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 18, alignItems: 'center' },
  confirmButtonDisabled: { backgroundColor: '#93c5fd' },
  confirmButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
