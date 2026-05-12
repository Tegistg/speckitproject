import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import StarRating from '../components/StarRating';
import { apiFetch } from '../services/apiClient';

type Props = {
  route: RouteProp<RootStackParamList, 'UserProfile'>;
};

interface PublicProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  avgRating: number | null;
  completedTransactionCount: number;
}

interface RatingItem {
  id: string;
  stars: number;
  comment?: string;
  createdAt: string;
  rater: { id: string; name: string };
}

export default function UserProfile({ route }: Props): React.JSX.Element {
  const { userId } = route.params;

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiFetch<PublicProfile>(`/users/${userId}`),
  });

  const { data: ratingsData, isLoading: loadingRatings } = useQuery({
    queryKey: ['ratings', userId],
    queryFn: () => apiFetch<{ avgRating: number | null; totalCount: number; data: RatingItem[] }>(`/users/${userId}/ratings`),
  });

  if (loadingProfile || !profile) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{profile.name[0]?.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.name}</Text>
        {profile.avgRating != null ? (
          <>
            <StarRating value={Math.round(profile.avgRating)} readonly size={20} />
            <Text style={styles.ratingText}>{profile.avgRating.toFixed(1)} avg rating</Text>
          </>
        ) : (
          <Text style={styles.noRatings}>No ratings yet</Text>
        )}
        <Text style={styles.transactions}>{profile.completedTransactionCount} completed transactions</Text>
      </View>

      <Text style={styles.sectionHeading}>Ratings</Text>
      {loadingRatings ? (
        <ActivityIndicator color="#2563eb" />
      ) : (ratingsData?.data?.length ?? 0) === 0 ? (
        <Text style={styles.emptyRatings}>No ratings yet</Text>
      ) : (
        <FlatList<RatingItem>
          data={ratingsData?.data}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.ratingItem}>
              <View style={styles.ratingHeader}>
                <Text style={styles.raterName}>{item.rater.name}</Text>
                <StarRating value={item.stars} readonly size={14} />
              </View>
              {item.comment && <Text style={styles.ratingComment}>{item.comment}</Text>}
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 28, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  ratingText: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  noRatings: { color: '#6b7280', fontSize: 14, marginTop: 8, fontStyle: 'italic' },
  transactions: { color: '#6b7280', fontSize: 13, marginTop: 6 },
  sectionHeading: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8 },
  emptyRatings: { color: '#6b7280', textAlign: 'center', padding: 16 },
  ratingItem: { padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  raterName: { fontWeight: '600', fontSize: 14 },
  ratingComment: { color: '#374151', fontSize: 13 },
});
