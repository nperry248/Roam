import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Calendar as CalendarIcon } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars'; // Import the calendar
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { trips } from '../db/schema';

type Status = 'ideated' | 'planned' | 'confirmed';

export default function AddTripScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  
  // Date State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const [status, setStatus] = useState<Status>('ideated');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !destination) {
      Alert.alert("Missing Info", "Please enter at least a title and destination.");
      return;
    }

    if (!startDate || !endDate) {
       Alert.alert("Missing Dates", "Please select a start and end date for your trip.");
       return;
    }

    setIsLoading(true);
    try {
      await db.insert(trips).values({
        title,
        destination,
        status,
        startDate, 
        endDate, 
      });
      navigation.goBack(); 
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save trip.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Selection Logic
  const onDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      // Start a new selection
      setStartDate(day.dateString);
      setEndDate('');
    } else if (startDate && !endDate) {
      // Logic to ensure end date is after start date
      if (new Date(day.dateString) < new Date(startDate)) {
        setStartDate(day.dateString); // Reset start date if clicked before
      } else {
        setEndDate(day.dateString); // Complete the range
      }
    }
  };

  // Generate the marked dates for the visual range
  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate) {
      marks[startDate] = { startingDay: true, color: colors.brand.primary, textColor: 'white' };
    }
    if (endDate) {
      marks[endDate] = { endingDay: true, color: colors.brand.primary, textColor: 'white' };
      
      // Fill the middle
      let currentDate = new Date(startDate);
      const stopDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start from next day

      while (currentDate < stopDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        marks[dateString] = { color: '#E2E8F0', textColor: colors.text.primary };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return marks;
  }, [startDate, endDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Adventure</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {/* Status Selector */}
        <Text style={styles.label}>TRIP STATUS</Text>
        <View style={styles.statusRow}>
          {(['ideated', 'planned', 'confirmed'] as Status[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={[
                styles.statusOption,
                status === s && { 
                  backgroundColor: colors.status[s].bg, 
                  borderColor: colors.status[s].text 
                }
              ]}
            >
              <Text 
                style={[
                  styles.statusText, 
                  status === s && { color: colors.status[s].text, fontWeight: 'bold' }
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <Text style={styles.label}>TRIP NAME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Weekend in Rome" 
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.label}>DESTINATION</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Rome, Italy" 
          value={destination}
          onChangeText={setDestination}
          placeholderTextColor={colors.text.muted}
        />

        {/* Date Selection Section */}
        <Text style={styles.label}>DATES</Text>
        <TouchableOpacity 
          style={styles.dateSelector} 
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <CalendarIcon size={20} color={colors.text.secondary} />
          <Text style={styles.dateText}>
            {startDate ? `${startDate}  →  ${endDate || 'Select End Date'}` : 'Tap to select dates'}
          </Text>
        </TouchableOpacity>

        {showCalendar && (
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={onDayPress}
              markingType={'period'}
              markedDates={markedDates}
              theme={{
                todayTextColor: colors.brand.primary,
                arrowColor: colors.brand.primary,
              }}
            />
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Create Trip"}
          </Text>
        </TouchableOpacity>
        
        {/* Padding for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  calendarContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: colors.brand.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});