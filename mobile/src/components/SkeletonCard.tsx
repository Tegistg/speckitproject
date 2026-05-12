import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonCard(): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.photo} />
      <View style={styles.info}>
        <View style={styles.titleLine} />
        <View style={styles.priceLine} />
        <View style={styles.sellerLine} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  photo: { width: 90, height: 90, backgroundColor: '#e5e7eb' },
  info: { flex: 1, padding: 12, justifyContent: 'center', gap: 8 },
  titleLine: { height: 14, backgroundColor: '#e5e7eb', borderRadius: 4, width: '70%' },
  priceLine: { height: 16, backgroundColor: '#e5e7eb', borderRadius: 4, width: '40%' },
  sellerLine: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 4, width: '55%' },
});
