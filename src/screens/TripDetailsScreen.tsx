import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Trash2, Calendar, MapPin, CheckCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import { db } from '../db/client';
import { trips, Trip } from '../db/schema';
import { eq } from 'drizzle-orm';

type ParamList = {
  TripDetails: { tripId: number };
};

export default function TripDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'TripDetails'>>();
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);

  const fetchTrip = async () => {
    const result = await db.select().from(trips).where(eq(trips.id, tripId));
    setTrip(result[0] || null);
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Trip", 
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await db.delete(trips).where(eq(trips.id, tripId));
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleStatusChange = async (newStatus: 'planned' | 'confirmed') => {
    await db.update(trips).set({ status: newStatus }).where(eq(trips.id, tripId));
    fetchTrip(); // Refresh local state
  };

  if (!trip) return <View style={styles.container} />;

  // Logic to determine the "Next Step" button
  let actionButton = null;
  if (trip.status === 'ideated') {
    actionButton = (
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: colors.status.planned.text }]}
        onPress={() => handleStatusChange('planned')}
      >
        <Text style={styles.actionButtonText}>Start Planning</Text>
      </TouchableOpacity>
    );
  } else if (trip.status === 'planned') {
    actionButton = (
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: colors.status.confirmed.text }]}
        onPress={() => handleStatusChange('confirmed')}
      >
        <Text style={styles.actionButtonText}>Confirm Trip</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
          <Trash2 color="#EF4444" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <StatusBadge status={trip.status as any} />
          <Text style={styles.title}>{trip.title}</Text>
          <View style={styles.row}>
            <MapPin size={16} color={colors.text.secondary} />
            <Text style={styles.subtitle}>{trip.destination}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Calendar size={20} color={colors.brand.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.label}>DATES</Text>
              <Text style={styles.value}>
                {trip.startDate ? `${trip.startDate}` : "No dates set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button (The Pipeline) */}
        {actionButton}

        {/* Placeholder for future features */}
        {trip.status === 'confirmed' && (
          <View style={styles.successBox}>
            <CheckCircle color={colors.status.confirmed.text} size={24} />
            <Text style={styles.successText}>You are all set! Safe travels.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  iconButton: { padding: 8 },
  content: { padding: 24 },
  titleSection: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary, marginVertical: 12 },
  subtitle: { fontSize: 18, color: colors.text.secondary, marginLeft: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: colors.brand.background, padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text.muted, letterSpacing: 1 },
  value: { fontSize: 16, color: colors.text.primary, fontWeight: '600', marginTop: 4 },
  actionButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.status.confirmed.bg, padding: 16, borderRadius: 12, gap: 12 },
  successText: { color: colors.status.confirmed.text, fontWeight: '600' }
});