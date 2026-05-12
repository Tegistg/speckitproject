import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Seller {
  id: string;
  name: string;
  avgRating: number | null;
}

interface ListingCardProps {
  id: string;
  title: string;
  priceCents: number;
  category: string;
  status: string;
  photoUrl?: string | null;
  seller: Seller;
  onPress: () => void;
}

export default function ListingCard({
  title,
  priceCents,
  category,
  status,
  photoUrl,
  seller,
  onPress,
}: ListingCardProps): React.JSX.Element {
  const price = (priceCents / 100).toFixed(2);
  const soldOut = status === 'sold_out';

  return (
    <TouchableOpacity style={[styles.card, soldOut && styles.soldOut]} onPress={onPress} disabled={soldOut}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>{category.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.price}>${price}</Text>
        <Text style={styles.seller}>
          {seller.name}{seller.avgRating != null ? ` ★ ${seller.avgRating.toFixed(1)}` : ''}
        </Text>
        {soldOut && <Text style={styles.soldOutBadge}>SOLD OUT</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  soldOut: { opacity: 0.5 },
  photo: { width: 90, height: 90 },
  photoPlaceholder: { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  seller: { fontSize: 12, color: '#6b7280' },
  soldOutBadge: { marginTop: 4, fontSize: 11, fontWeight: '700', color: '#ef4444' },
});
