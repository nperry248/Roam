import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Calendar as CalendarIcon, Camera } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/storage';

type Status = 'ideated' | 'planned' | 'confirmed';

export default function AddTripScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [status, setStatus] = useState<Status>('ideated');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickCover = () => {
    Alert.alert('Cover Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) setCoverUri(result.assets[0].uri);
      }},
      { text: 'Choose from Library', onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
        if (!result.canceled) setCoverUri(result.assets[0].uri);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString); setEndDate('');
    } else if (new Date(day.dateString) < new Date(startDate)) {
      setStartDate(day.dateString);
    } else {
      setEndDate(day.dateString);
    }
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate) marks[startDate] = { startingDay: true, color: colors.brand.primary, textColor: 'white' };
    if (endDate) {
      marks[endDate] = { endingDay: true, color: colors.brand.primary, textColor: 'white' };
      let cur = new Date(startDate); cur.setDate(cur.getDate() + 1);
      while (cur < new Date(endDate)) {
        marks[cur.toISOString().split('T')[0]] = { color: '#DBEAFE', textColor: colors.text.primary };
        cur.setDate(cur.getDate() + 1);
      }
    }
    return marks;
  }, [startDate, endDate]);

  const formatDateLabel = () => {
    if (!startDate) return 'Tap to select dates';
    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return endDate ? `${fmt(startDate)}  →  ${fmt(endDate)}` : `${fmt(startDate)}  →  ...`;
  };

  const handleSave = async () => {
    if (!title || !destination) { Alert.alert('Missing Info', 'Please enter a title and destination.'); return; }
    if (!startDate || !endDate) { Alert.alert('Missing Dates', 'Please select a start and end date.'); return; }

    setIsLoading(true);
    try {
      let coverImageUrl: string | null = null;
      if (coverUri) coverImageUrl = await uploadImage('trip-covers', coverUri);

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('trips').insert({
        user_id: user!.id,
        title, destination, status,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
        cover_image_url: coverImageUrl,
      });
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Adventure</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverPicker} onPress={pickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverPreview} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Camera size={28} color={colors.text.muted} />
              <Text style={styles.coverPlaceholderText}>Add cover photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Status */}
        <Text style={styles.label}>STATUS</Text>
        <View style={styles.statusRow}>
          {(['ideated', 'planned', 'confirmed'] as Status[]).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={[styles.statusOpt, status === s && { backgroundColor: colors.status[s].bg, borderColor: colors.status[s].text }]}
            >
              <Text style={[styles.statusText, status === s && { color: colors.status[s].text, fontWeight: '700' }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TRIP NAME</Text>
        <TextInput style={styles.input} placeholder="e.g. Weekend in Rome" value={title} onChangeText={setTitle} placeholderTextColor={colors.text.muted} />

        <Text style={styles.label}>DESTINATION</Text>
        <TextInput style={styles.input} placeholder="e.g. Rome, Italy" value={destination} onChangeText={setDestination} placeholderTextColor={colors.text.muted} />

        <Text style={styles.label}>DATES</Text>
        <TouchableOpacity style={styles.datePicker} onPress={() => setShowCalendar(!showCalendar)}>
          <CalendarIcon size={18} color={colors.text.secondary} />
          <Text style={[styles.dateText, !startDate && { color: colors.text.muted }]}>{formatDateLabel()}</Text>
        </TouchableOpacity>

        {showCalendar && (
          <View style={styles.calendarWrap}>
            <Calendar
              onDayPress={onDayPress}
              markingType="period"
              markedDates={markedDates}
              theme={{ todayTextColor: colors.brand.primary, arrowColor: colors.brand.primary }}
            />
          </View>
        )}

        <Text style={styles.label}>NOTES (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Things to remember..."
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor={colors.text.muted}
        />

        <TouchableOpacity style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Create Trip</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.brand.primary },
  closeBtn: { padding: 4 },
  form: { padding: 24 },
  coverPicker: { marginBottom: 24, borderRadius: 16, overflow: 'hidden', height: 160, backgroundColor: '#F1F5F9' },
  coverPreview: { flex: 1, borderRadius: 16 },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverPlaceholderText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, color: colors.text.primary },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusOpt: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'white' },
  statusText: { fontSize: 12, color: colors.text.secondary },
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, gap: 10 },
  dateText: { fontSize: 15, color: colors.text.primary, fontWeight: '500' },
  calendarWrap: { marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden' },
  saveBtn: { backgroundColor: colors.brand.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32, shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
