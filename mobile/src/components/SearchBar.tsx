import React, { useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search snacks…' }: Props): React.JSX.Element {
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (text: string) => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => onChange(text), 400);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        defaultValue={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.clear} onPress={() => onChange('')}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#111827' },
  clear: { padding: 4 },
  clearText: { color: '#9ca3af', fontSize: 14 },
});
