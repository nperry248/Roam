import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TripCard from '../components/TripCard';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { Trip } from '../db/schema';

type RootStackParamList = {
  Dashboard: undefined;
  AddTrip: undefined;
  TripDetails: { tripId: string };
};
type Nav = NativeStackNavigationProp<RootStackParamList>;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(start?: string | null, end?: string | null) {
  if (!start) return 'Dates TBD';
  const fmt = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  return end ? `${fmt(start)} → ${fmt(end)}` : fmt(start);
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true });
    if (data) setTrips(data as Trip[]);
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, []));

  const onRefresh = async () => { setRefreshing(true); await fetchTrips(); setRefreshing(false); };

  const nextTrip = trips.find(t => t.status === 'confirmed');
  const plannedTrips = trips.filter(t => t.status === 'planned');
  const ideatedTrips = trips.filter(t => t.status === 'ideated');
  const totalBudget = trips.reduce((s, t) => s + (t.budget ?? 0), 0);
  const nextDays = nextTrip ? daysUntil(nextTrip.start_date) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.headline}>Your Adventures</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTrip')}>
            <Plus color="white" size={22} />
          </TouchableOpacity>
        </View>

        {trips.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={[styles.statCard, { flex: 1.4 }]}>
              <Text style={styles.statValue}>{nextDays !== null && nextDays >= 0 ? `${nextDays}d` : '—'}</Text>
              <Text style={styles.statLabel}>{nextDays !== null && nextDays >= 0 ? 'Until next trip' : 'No trip booked'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${(totalBudget / 100).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>
          </View>
        )}

        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to start planning your first adventure.</Text>
          </View>
        ) : (
          <>
            {nextTrip && (
              <>
                <Text style={styles.sectionTitle}>Up Next ✈️</Text>
                <TripCard
                  title={nextTrip.title}
                  destination={nextTrip.destination}
                  dates={formatDate(nextTrip.start_date, nextTrip.end_date)}
                  status="confirmed"
                  coverImageUrl={nextTrip.cover_image_url}
                  onPress={() => navigation.navigate('TripDetails', { tripId: nextTrip.id })}
                />
              </>
            )}
            {plannedTrips.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>In The Works 🚧</Text>
                {plannedTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    title={trip.title}
                    destination={trip.destination}
                    dates={formatDate(trip.start_date, trip.end_date)}
                    status="planned"
                    coverImageUrl={trip.cover_image_url}
                    onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
                  />
                ))}
              </>
            )}
            {ideatedTrips.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Dream Board 💭</Text>
                <View style={styles.grid}>
                  {ideatedTrips.map(trip => (
                    <View key={trip.id} style={styles.gridItem}>
                      <TripCard
                        title={trip.title}
                        destination={trip.destination}
                        dates={formatDate(trip.start_date, trip.end_date)}
                        status="ideated"
                        coverImageUrl={trip.cover_image_url}
                        onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  scroll: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '600', color: colors.text.secondary, marginBottom: 2 },
  headline: { fontSize: 30, fontWeight: '800', color: colors.text.primary },
  addBtn: {
    backgroundColor: colors.brand.primary, padding: 12, borderRadius: 50,
    shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.brand.primary },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.text.muted, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  empty: { marginTop: 60, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
  emptySubtitle: { fontSize: 15, color: colors.text.secondary, textAlign: 'center' },
});
