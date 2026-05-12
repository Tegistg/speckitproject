import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import * as listingService from '../services/listingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ListingDetail'>;
  route: RouteProp<RootStackParamList, 'ListingDetail'>;
};

export default function ListingDetail({ navigation, route }: Props): React.JSX.Element {
  const { listingId } = route.params;

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getById(listingId),
  });

  if (isLoading || !listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const price = (listing.priceCents / 100).toFixed(2);
  const soldOut = listing.status === 'sold_out';

  return (
    <ScrollView style={styles.container}>
      {listing.photoUrl ? (
        <Image source={{ uri: listing.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>{listing.category.toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>${price}</Text>

        {listing.description ? (
          <Text style={styles.description}>{listing.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Category:</Text>
          <Text style={styles.metaValue}>{listing.category}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Quantity available:</Text>
          <Text style={styles.metaValue}>{soldOut ? '0 (sold out)' : listing.quantity}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Payment:</Text>
          <Text style={styles.metaValue}>{listing.acceptedPaymentMethods.join(', ')}</Text>
        </View>

        <View style={styles.sellerSection}>
          <Text style={styles.sellerLabel}>Seller</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { userId: listing.seller.id })}
          >
            <Text style={styles.sellerName}>
              {listing.seller.name}
              {listing.seller.avgRating != null ? ` ★ ${listing.seller.avgRating.toFixed(1)}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.orderButton, soldOut && styles.orderButtonDisabled]}
          disabled={soldOut}
          onPress={() => navigation.navigate('OrderConfirmation', { listingId })}
        >
          <Text style={styles.orderButtonText}>{soldOut ? 'Sold Out' : 'Order Now'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: 240 },
  photoPlaceholder: { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { fontSize: 24, color: '#9ca3af', fontWeight: '700' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', color: '#2563eb', marginBottom: 12 },
  description: { fontSize: 15, color: '#374151', marginBottom: 16, lineHeight: 22 },
  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaLabel: { fontWeight: '600', width: 140, color: '#6b7280' },
  metaValue: { flex: 1, color: '#111827' },
  sellerSection: { marginVertical: 20, paddingTop: 16, borderTopWidth: 1, borderColor: '#f3f4f6' },
  sellerLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  orderButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 18, alignItems: 'center', marginTop: 8 },
  orderButtonDisabled: { backgroundColor: '#d1d5db' },
  orderButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
