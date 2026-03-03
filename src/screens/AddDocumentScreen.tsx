import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, Plane, Bed, Ticket } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

type ParamList = { AddDocument: { tripId: string } };

const TYPES = [
  { id: 'transport', label: 'Transport', icon: Plane },
  { id: 'stay', label: 'Stay', icon: Bed },
  { id: 'activity', label: 'Activity', icon: Ticket },
];

export default function AddDocumentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AddDocument'>>();
  const { tripId } = route.params;
  const [type, setType] = useState('transport');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title) { Alert.alert('Missing Info', 'Please enter a title.'); return; }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('documents').insert({
        user_id: user!.id,
        trip_id: tripId,
        type, title,
        subtitle: subtitle || null,
        link: link || null,
      });
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Info</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>TYPE</Text>
        <View style={styles.typeRow}>
          {TYPES.map(t => (
            <TouchableOpacity key={t.id} style={[styles.typeBtn, type === t.id && styles.typeBtnActive]} onPress={() => setType(t.id)}>
              <t.icon size={20} color={type === t.id ? 'white' : colors.text.secondary} />
              <Text style={[styles.typeText, type === t.id && { color: 'white' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>TITLE</Text>
        <TextInput style={styles.input} placeholder="e.g. Flight to Rome" value={title} onChangeText={setTitle} placeholderTextColor={colors.text.muted} />
        <Text style={styles.label}>DETAILS (Optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. Flight #FR209, Seat 14A" value={subtitle} onChangeText={setSubtitle} placeholderTextColor={colors.text.muted} />
        <Text style={styles.label}>LINK (Optional)</Text>
        <TextInput style={styles.input} placeholder="https://..." value={link} onChangeText={setLink} autoCapitalize="none" placeholderTextColor={colors.text.muted} />
        <TouchableOpacity style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Info</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  closeBtn: { padding: 4 },
  form: { padding: 24 },
  label: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', minWidth: 84, gap: 4 },
  typeBtnActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  typeText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  saveBtn: { backgroundColor: colors.brand.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40, shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
