import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, Plane, Bed, Ticket } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { documents } from '../db/schema';

type ParamList = {
  AddDocument: { tripId: number };
};

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
    if (!title) {
      Alert.alert("Missing Info", "Please enter a title (e.g. Flight to Rome).");
      return;
    }

    setIsLoading(true);
    try {
      await db.insert(documents).values({
        tripId,
        type,
        title,
        subtitle: subtitle || null,
        link: link || null,
      });
      navigation.goBack(); 
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save document.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Info</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Type Selector */}
        <Text style={styles.label}>TYPE</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.typeButton, type === t.id && styles.typeButtonActive]}
              onPress={() => setType(t.id)}
            >
              <t.icon size={20} color={type === t.id ? 'white' : colors.text.secondary} />
              <Text style={[styles.typeText, type === t.id && styles.typeTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TITLE</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Flight to Rome" 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>DETAILS (Optional)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Flight #FR209, Seat 14A" 
          value={subtitle}
          onChangeText={setSubtitle}
        />

        <Text style={styles.label}>LINK / URL (Optional)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="https://..." 
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save Info</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  closeButton: { padding: 4 },
  form: { padding: 24 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', minWidth: 80, gap: 4 },
  typeButtonActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  typeText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  typeTextActive: { color: 'white' },
  saveButton: { backgroundColor: colors.brand.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});