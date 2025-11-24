import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // 1. Import this
import { db } from '../db/client';
import { trips, Trip } from '../db/schema';
import { desc } from 'drizzle-orm';
import { colors } from '../theme/colors';
import TripCard from '../components/TripCard';

// 2. Define the Navigation Types
type RootStackParamList = {
  Dashboard: undefined;
  AddTrip: undefined;
  TripDetails: { tripId: number };
};

type TripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'ideated' | 'planned' | 'confirmed';

export default function TripsScreen() {
  // 3. Apply the type to the hook
  const navigation = useNavigation<TripsScreenNavigationProp>();
  
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch all trips ordered by date
  const fetchTrips = async () => {
    try {
      const result = await db.select().from(trips).orderBy(desc(trips.startDate));
      setAllTrips(result);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  // Filter logic
  const filteredTrips = allTrips.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleTripPress = (id: number) => {
    // 4. Clean navigation call (No 'as never' hacks needed)
    navigation.navigate('TripDetails', { tripId: id });
  };

  const formatDate = (start?: string | null, end?: string | null) => {
    if (!start) return "Dates TBD";
    return `${start} - ${end || '...'}`;
  };

  const renderFilterTab = (key: FilterType, label: string) => {
    const isActive = filter === key;
    // Determine active color based on the specific filter type for extra flair
    let activeColor = colors.brand.primary;
    if (key === 'ideated') activeColor = colors.status.ideated.text;
    if (key === 'planned') activeColor = colors.status.planned.text;
    if (key === 'confirmed') activeColor = colors.status.confirmed.text;

    return (
      <TouchableOpacity 
        onPress={() => setFilter(key)}
        style={[
          styles.tab, 
          isActive && { backgroundColor: activeColor, borderColor: activeColor }
        ]}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Adventures</Text>
        <Text style={styles.subtitle}>{allTrips.length} Total Trips</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsScroll}>
          {renderFilterTab('all', 'All')}
          {renderFilterTab('ideated', 'Ideated')}
          {renderFilterTab('planned', 'Planned')}
          {renderFilterTab('confirmed', 'Confirmed')}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredTrips}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trips found in this category.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TripCard
            title={item.title}
            dates={formatDate(item.startDate, item.endDate)}
            status={item.status as any}
            onPress={() => handleTripPress(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text.primary },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  
  tabsContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  tabsScroll: { flexDirection: 'row', gap: 8 },
  tab: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    backgroundColor: 'white' 
  },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  activeTabText: { color: 'white' },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.text.muted, fontSize: 16 }
});