import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { CalendarList, DateData } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { Trip } from '../db/schema';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<{ TripDetails: { tripId: string } }>;

export default function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('*');
    if (data) setAllTrips(data as Trip[]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, []));

  const markedDates = useMemo(() => {
    const marks: any = {};
    allTrips.forEach(trip => {
      if (!trip.start_date || !trip.end_date) return;
      let color = colors.status.ideated.text;
      if (trip.status === 'planned') color = colors.status.planned.text;
      if (trip.status === 'confirmed') color = colors.status.confirmed.text;

      let cur = new Date(trip.start_date + 'T00:00:00');
      const stop = new Date(trip.end_date + 'T00:00:00');
      while (cur <= stop) {
        const ds = cur.toISOString().split('T')[0];
        marks[ds] = { startingDay: ds === trip.start_date, endingDay: ds === trip.end_date, color, textColor: 'white', tripId: trip.id };
        cur.setDate(cur.getDate() + 1);
      }
    });
    return marks;
  }, [allTrips]);

  const handleDayPress = (day: DateData) => {
    const mark = markedDates[day.dateString];
    if (mark?.tripId) navigation.navigate('TripDetails', { tripId: mark.tripId });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.brand.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Calendar</Text></View>
      <CalendarList
        pastScrollRange={6}
        futureScrollRange={12}
        scrollEnabled
        onDayPress={handleDayPress}
        markingType="period"
        markedDates={markedDates}
        theme={{
          calendarBackground: colors.brand.background,
          textSectionTitleColor: colors.text.secondary,
          todayTextColor: colors.brand.primary,
          dayTextColor: colors.text.primary,
          textDisabledColor: '#d9e1e8',
          monthTextColor: colors.brand.primary,
          textMonthFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 12,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
