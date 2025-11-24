import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import this
import TripCard from '../components/TripCard';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { trips, Trip } from '../db/schema';
import { desc } from 'drizzle-orm';

// 1. Define the types for your stack
type RootStackParamList = {
  Dashboard: undefined;
  AddTrip: undefined;
  TripDetails: { tripId: number }; // Define the params here
};

// 2. Create a specific type for this screen's navigation
type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  // 3. Apply the type to the hook
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const result = await db.select().from(trips).orderBy(desc(trips.startDate));
      setMyTrips(result);
    } catch (e) {
      console.error("Failed to fetch trips", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const handleTripPress = (id: number) => {
    // 4. Now TypeScript knows 'TripDetails' accepts { tripId: number }
    navigation.navigate('TripDetails', { tripId: id });
  };

  const formatDate = (start?: string | null, end?: string | null) => {
    if (!start) return "Dates TBD";
    return `${start} - ${end || '...'}`;
  };

  const nextTrip = myTrips.find(t => t.status === 'confirmed');
  const plannedTrips = myTrips.filter(t => t.status === 'planned');
  const ideatedTrips = myTrips.filter(t => t.status === 'ideated');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.mainHeader}>Hey, Nick</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('AddTrip')}
          >
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>

        {myTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No trips yet!</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to start planning your first adventure.</Text>
          </View>
        ) : (
          <>
            {nextTrip && (
              <>
                <Text style={styles.sectionTitle}>Up Next ✈️</Text>
                <TripCard 
                  title={nextTrip.title} 
                  dates={formatDate(nextTrip.startDate, nextTrip.endDate)} 
                  status="confirmed"
                  onPress={() => handleTripPress(nextTrip.id)}
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
                    dates={formatDate(trip.startDate, trip.endDate)} 
                    status="planned"
                    onPress={() => handleTripPress(trip.id)}
                  />
                ))}
              </>
            )}

            {ideatedTrips.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Dream Board 💭</Text>
                <View style={styles.gridContainer}>
                   {ideatedTrips.map(trip => (
                     <View key={trip.id} style={styles.gridItem}>
                       <TripCard 
                         title={trip.title} 
                         dates={formatDate(trip.startDate, trip.endDate)} 
                         status="ideated" 
                         onPress={() => handleTripPress(trip.id)}
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
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  subHeader: { fontSize: 12, fontWeight: '600', color: colors.text.secondary, letterSpacing: 1.5, marginBottom: 4 },
  mainHeader: { fontSize: 32, fontWeight: '800', color: colors.brand.primary },
  addButton: { backgroundColor: colors.brand.primary, padding: 12, borderRadius: 50, shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 12, marginTop: 12 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  gridItem: { width: '48%' },
  emptyState: { marginTop: 40, alignItems: 'center', padding: 20, backgroundColor: colors.brand.surface, borderRadius: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' }
});