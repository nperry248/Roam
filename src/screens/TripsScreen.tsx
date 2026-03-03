import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import TripCard from '../components/TripCard';
import { supabase } from '../lib/supabase';
import { Trip } from '../db/schema';

type RootStackParamList = { TripDetails: { tripId: string } };
type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'ideated' | 'planned' | 'confirmed';

function formatDate(start?: string | null, end?: string | null) {
  if (!start) return 'Dates TBD';
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} → ${fmt(end)}` : fmt(start);
}

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('*').order('start_date', { ascending: true });
    if (data) setAllTrips(data as Trip[]);
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, []));

  const filtered = allTrips.filter(t => filter === 'all' || t.status === filter);

  const FILTERS: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: colors.brand.primary },
    { key: 'ideated', label: 'Dreaming', color: colors.status.ideated.text },
    { key: 'planned', label: 'Planning', color: colors.status.planned.text },
    { key: 'confirmed', label: 'Confirmed', color: colors.status.confirmed.text },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Adventures</Text>
        <Text style={styles.subtitle}>{allTrips.length} trip{allTrips.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.tabsRow}>
        {FILTERS.map(({ key, label, color }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.tab, active && { backgroundColor: color, borderColor: color }]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No trips in this category.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TripCard
            title={item.title}
            destination={item.destination}
            dates={formatDate(item.start_date, item.end_date)}
            status={item.status}
            coverImageUrl={item.cover_image_url}
            onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text.primary },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'white' },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  tabTextActive: { color: 'white' },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.text.muted, fontSize: 15 },
});
