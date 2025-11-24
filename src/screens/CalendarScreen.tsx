import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { CalendarList, DateData } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../db/client';
import { trips, Trip } from '../db/schema';
import { colors } from '../theme/colors';

// Types
type RootStackParamList = {
  TripDetails: { tripId: number };
};
type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Trips
  const fetchTrips = async () => {
    try {
      const result = await db.select().from(trips);
      setAllTrips(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  // 2. Transform Trips into Calendar Markers
  // This logic converts "2023-10-01" to "2023-10-05" into an object marking every day in between
  const markedDates = useMemo(() => {
    const marks: any = {};

    allTrips.forEach((trip) => {
      if (!trip.startDate || !trip.endDate) return;

      // Get color based on status
      let color = colors.status.ideated.text; // Default Red
      if (trip.status === 'planned') color = colors.status.planned.text; // Amber
      if (trip.status === 'confirmed') color = colors.status.confirmed.text; // Green

      let currentDate = new Date(trip.startDate);
      const stopDate = new Date(trip.endDate);

      // Loop through dates
      while (currentDate <= stopDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        const isStart = dateString === trip.startDate;
        const isEnd = dateString === trip.endDate;

        marks[dateString] = {
          startingDay: isStart,
          endingDay: isEnd,
          color: color,
          textColor: 'white',
          status: trip.status, // Custom data we can use later
          id: trip.id
        };

        // Increment day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return marks;
  }, [allTrips]);

  const handleDayPress = (day: DateData) => {
    const mark = markedDates[day.dateString];
    if (mark && mark.id) {
      navigation.navigate('TripDetails', { tripId: mark.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>
      
      <CalendarList
        // Visual Config
        pastScrollRange={6}
        futureScrollRange={12}
        scrollEnabled={true}
        showScrollIndicator={true}
        
        // Interaction
        onDayPress={handleDayPress}
        markingType={'period'}
        markedDates={markedDates}
        
        // Theme Config
        theme={{
          calendarBackground: colors.brand.background,
          textSectionTitleColor: colors.text.secondary,
          selectedDayBackgroundColor: colors.brand.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.brand.primary,
          dayTextColor: colors.text.primary,
          textDisabledColor: '#d9e1e8',
          monthTextColor: colors.brand.primary,
          textMonthFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 12
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.brand.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});