import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  message?: string;
  onClearFilters?: () => void;
}

export default function EmptyState({ message = 'No results found', onClearFilters }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onClearFilters && (
        <TouchableOpacity onPress={onClearFilters}>
          <Text style={styles.clear}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  message: { fontSize: 16, color: '#6b7280', marginBottom: 12 },
  clear: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
});
