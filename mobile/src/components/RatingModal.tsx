import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import StarRating from './StarRating';

interface Props {
  visible: boolean;
  orderId: string;
  onSubmit: (stars: number, comment?: string) => Promise<void>;
  onDismiss: () => void;
}

export default function RatingModal({ visible, onSubmit, onDismiss }: Props): React.JSX.Element {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(): Promise<void> {
    if (stars === 0) return;
    setLoading(true);
    try {
      await onSubmit(stars, comment.trim() || undefined);
      setStars(0);
      setComment('');
      onDismiss();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Rate This Transaction</Text>
          <StarRating value={stars} onChange={setStars} size={36} />
          <TextInput
            style={styles.input}
            placeholder="Leave a comment (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.submitBtn, (stars === 0 || loading) && styles.disabled]}
            onPress={handleSubmit}
            disabled={stars === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Rating</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginTop: 16, fontSize: 14, height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  disabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn: { alignItems: 'center', marginTop: 12 },
  skipText: { color: '#6b7280', fontSize: 14 },
});
