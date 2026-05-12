import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as listingService from '../services/listingService';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const CATEGORIES = ['savory', 'sweet', 'drinks', 'snacks', 'other'] as const;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateListing'>;
};

export default function CreateListing({ navigation }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('snacks');
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptStripe, setAcceptStripe] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const priceCents = Math.round(parseFloat(price) * 100);
      const listing = await listingService.createListing({
        title: title.trim(),
        description: description.trim() || undefined,
        priceCents,
        quantity: parseInt(quantity),
        category,
        acceptedPaymentMethods: [
          ...(acceptCash ? ['cash'] : []),
          ...(acceptStripe ? ['stripe'] : []),
        ],
      });

      if (photoUri) {
        const formData = new FormData();
        formData.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'photo.jpg' } as never);
        await fetch(`${API_URL}/listings/${listing.id}/photo`, {
          method: 'POST',
          body: formData,
        });
      }
      return listing;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert('Listing Created!', 'Your snack is now visible to buyers.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  async function pickPhoto(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function validate(): boolean {
    if (!title.trim()) { Alert.alert('Error', 'Title is required.'); return false; }
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) { Alert.alert('Error', 'Enter a valid price.'); return false; }
    if (!acceptCash && !acceptStripe) { Alert.alert('Error', 'Select at least one payment method.'); return false; }
    return true;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>New Listing</Text>

      <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoPickerText}>+ Add Photo (optional)</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, styles.multiline]} placeholder="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Price ($) *" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <TextInput style={[styles.input, styles.half]} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.categoryChip, category === c && styles.categoryChipSelected]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextSelected]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Payment Methods</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Cash on Pickup</Text>
        <Switch value={acceptCash} onValueChange={setAcceptCash} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Online Payment</Text>
        <Switch value={acceptStripe} onValueChange={setAcceptStripe} />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isPending && styles.disabled]}
        onPress={() => { if (validate()) submit(); }}
        disabled={isPending}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Listing</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  photoPicker: { width: '100%', height: 160, backgroundColor: '#f3f4f6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoPickerText: { color: '#6b7280', fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 15 },
  multiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb' },
  categoryChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  categoryChipText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  categoryChipTextSelected: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  switchLabel: { fontSize: 15, color: '#374151' },
  submitButton: { backgroundColor: '#2563eb', borderRadius: 10, padding: 18, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
