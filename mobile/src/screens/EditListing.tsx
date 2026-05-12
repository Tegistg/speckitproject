import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as listingService from '../services/listingService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditListing'>;
  route: RouteProp<RootStackParamList, 'EditListing'>;
};

export default function EditListing({ navigation, route }: Props): React.JSX.Element {
  const { listingId } = route.params;
  const queryClient = useQueryClient();

  const { data: listing } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getById(listingId),
  });

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (listing) {
      setPrice((listing.priceCents / 100).toFixed(2));
      setQuantity(String(listing.quantity));
    }
  }, [listing]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      listingService.updateListing(listingId, {
        priceCents: Math.round(parseFloat(price) * 100),
        quantity: parseInt(quantity),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      void queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      Alert.alert('Updated!', 'Your listing has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (!listing) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Edit Listing</Text>
      <Text style={styles.title}>{listing.title}</Text>

      <Text style={styles.label}>Price ($)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

      <Text style={styles.label}>Quantity</Text>
      <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />

      <TouchableOpacity
        style={[styles.button, isPending && styles.disabled]}
        onPress={() => save()}
        disabled={isPending}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
