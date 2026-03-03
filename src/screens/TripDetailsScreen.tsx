import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput, Linking, ImageBackground, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Trash2, MapPin, Plus, Plane, Bed, Ticket, ExternalLink, Utensils, Bus, CreditCard, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/storage';
import { Trip, Expense, Document } from '../db/schema';

type RootStackParamList = {
  TripDetails: { tripId: string };
  AddExpense: { tripId: string };
  AddDocument: { tripId: string };
  TripGallery: { tripId: string; title: string };
};
type Nav = NativeStackNavigationProp<RootStackParamList>;
type TripDetailsRouteProp = RouteProp<RootStackParamList, 'TripDetails'>;

const CATEGORY_ICONS: Record<string, any> = {
  food: Utensils, transport: Bus, stay: Bed, activity: Ticket, other: CreditCard,
};
const DOC_ICONS: Record<string, any> = { transport: Plane, stay: Bed, activity: Ticket };

export default function TripDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TripDetailsRouteProp>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);
  const [tripDocs, setTripDocs] = useState<Document[]>([]);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchData = async () => {
    const [{ data: t }, { data: e }, { data: d }] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('trip_id', tripId),
    ]);
    if (t) setTrip(t as Trip);
    if (e) setTripExpenses(e as Expense[]);
    if (d) setTripDocs(d as Document[]);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [tripId]));

  const saveBudget = async () => {
    const budgetCents = parseFloat(budgetInput) * 100;
    await supabase.from('trips').update({ budget: Math.round(budgetCents) }).eq('id', tripId);
    setIsEditingBudget(false);
    fetchData();
  };

  const handleDelete = () => {
    Alert.alert('Delete Trip', 'This will permanently delete the trip and all its data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('trips').delete().eq('id', tripId);
        navigation.goBack();
      }},
    ]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert('Delete Expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('expenses').delete().eq('id', expenseId);
        fetchData();
      }},
    ]);
  };

  const handleStatusChange = async (newStatus: 'planned' | 'confirmed') => {
    await supabase.from('trips').update({ status: newStatus }).eq('id', tripId);
    fetchData();
  };

  const handleChangeCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage('trip-covers', result.assets[0].uri);
      await supabase.from('trips').update({ cover_image_url: url }).eq('id', tripId);
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Could not upload image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const openLink = (url: string | null) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open link'));
  };

  if (!trip) return <View style={styles.container}><ActivityIndicator style={{ marginTop: 100 }} color={colors.brand.primary} /></View>;

  const totalSpent = tripExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = trip.budget ?? 0;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const barColor = pct > 100 ? '#EF4444' : pct > 75 ? '#F59E0B' : '#10B981';

  const fmt = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '?';

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        {trip.cover_image_url ? (
          <ImageBackground source={{ uri: trip.cover_image_url }} style={styles.heroImage}>
            <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.6)']} style={styles.heroGradient}>
              <View style={styles.heroActions}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBtn}>
                  <ArrowLeft color="white" size={22} />
                </TouchableOpacity>
                <View style={styles.heroActionsRight}>
                  <TouchableOpacity onPress={handleChangeCover} style={styles.heroBtn}>
                    {uploadingCover ? <ActivityIndicator color="white" size="small" /> : <Camera color="white" size={20} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.heroBtn}>
                    <Trash2 color="#FCA5A5" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={[styles.heroImage, { backgroundColor: colors.brand.primary }]}>
            <View style={styles.heroActions}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <ArrowLeft color="white" size={22} />
              </TouchableOpacity>
              <View style={styles.heroActionsRight}>
                <TouchableOpacity onPress={handleChangeCover} style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  {uploadingCover ? <ActivityIndicator color="white" size="small" /> : <Camera color="white" size={20} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={[styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Trash2 color="white" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <StatusBadge status={trip.status as any} />
          <Text style={styles.title}>{trip.title}</Text>
          <View style={styles.row}>
            <MapPin size={15} color={colors.text.secondary} />
            <Text style={styles.subtitle}>{trip.destination}</Text>
          </View>
          <Text style={styles.dates}>{fmt(trip.start_date)} → {fmt(trip.end_date)}</Text>
          {trip.notes && <Text style={styles.notes}>{trip.notes}</Text>}
        </View>

        {/* Gallery quick-link */}
        <TouchableOpacity style={styles.galleryLink} onPress={() => navigation.navigate('TripGallery', { tripId, title: trip.title })}>
          <Text style={styles.galleryLinkText}>📸 View Photos</Text>
        </TouchableOpacity>

        {/* Documents */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>DETAILS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddDocument', { tripId })}>
            <Plus size={20} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.docsList}>
          {tripDocs.length === 0 ? (
            <Text style={styles.emptyText}>No tickets or info added yet.</Text>
          ) : (
            tripDocs.map(doc => {
              const Icon = DOC_ICONS[doc.type] ?? Ticket;
              return (
                <TouchableOpacity key={doc.id} style={styles.docCard} onPress={() => openLink(doc.link)} disabled={!doc.link}>
                  <View style={styles.docIconBox}><Icon size={18} color={colors.brand.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    {doc.subtitle && <Text style={styles.docSubtitle}>{doc.subtitle}</Text>}
                  </View>
                  {doc.link && <ExternalLink size={15} color={colors.text.muted} />}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Budget */}
        <View style={[styles.sectionRow, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>BUDGET</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { tripId })}>
            <Plus size={20} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.budgetLabel}>SPENT</Text>
              <Text style={styles.budgetValue}>${(totalSpent / 100).toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetLabel}>BUDGET</Text>
              {isEditingBudget ? (
                <TextInput value={budgetInput} onChangeText={setBudgetInput} style={styles.budgetInput} keyboardType="numeric" autoFocus onBlur={saveBudget} />
              ) : (
                <TouchableOpacity onPress={() => { setBudgetInput(((trip.budget ?? 0) / 100).toString()); setIsEditingBudget(true); }}>
                  <Text style={[styles.budgetValue, { color: colors.text.secondary }]}>${(totalBudget / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
          </View>
          {tripExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses logged yet.</Text>
          ) : (
            tripExpenses.map(exp => {
              const Icon = CATEGORY_ICONS[exp.category] ?? CreditCard;
              return (
                <TouchableOpacity key={exp.id} style={styles.expenseRow} onLongPress={() => handleDeleteExpense(exp.id)}>
                  <View style={styles.expenseIconBox}><Icon size={14} color={colors.brand.primary} /></View>
                  <Text style={styles.expenseTitle}>{exp.title}</Text>
                  <Text style={styles.expenseAmount}>-${(exp.amount / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Status actions */}
        {trip.status === 'ideated' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.status.planned.text }]} onPress={() => handleStatusChange('planned')}>
            <Text style={styles.actionBtnText}>Start Planning</Text>
          </TouchableOpacity>
        )}
        {trip.status === 'planned' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.status.confirmed.text }]} onPress={() => handleStatusChange('confirmed')}>
            <Text style={styles.actionBtnText}>Confirm Trip ✓</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  hero: { height: 200 },
  heroImage: { flex: 1 },
  heroGradient: { flex: 1 },
  heroActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  heroActionsRight: { flexDirection: 'row', gap: 8 },
  heroBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingBottom: 100 },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text.primary, marginVertical: 10 },
  subtitle: { fontSize: 16, color: colors.text.secondary, marginLeft: 5 },
  dates: { fontSize: 14, color: colors.text.secondary, marginTop: 6 },
  notes: { marginTop: 10, fontSize: 14, color: colors.text.secondary, lineHeight: 20, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center' },
  galleryLink: { backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14, marginBottom: 28, alignItems: 'center' },
  galleryLinkText: { fontSize: 14, fontWeight: '700', color: colors.brand.primary },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.text.primary, letterSpacing: 0.5 },
  docsList: { gap: 10 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  docIconBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  docTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  docSubtitle: { fontSize: 12, color: colors.text.secondary, marginTop: 1 },
  budgetCard: { backgroundColor: colors.brand.background, padding: 20, borderRadius: 20, marginBottom: 24 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  budgetLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1, marginBottom: 4 },
  budgetValue: { fontSize: 24, fontWeight: '800', color: colors.text.primary },
  budgetInput: { fontSize: 24, fontWeight: '800', color: colors.text.primary, textAlign: 'right', borderBottomWidth: 1, borderColor: colors.brand.primary, minWidth: 80, padding: 0 },
  progressBg: { height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 5 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  expenseIconBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  expenseTitle: { flex: 1, fontSize: 14, color: colors.text.secondary, fontWeight: '500' },
  expenseAmount: { fontSize: 14, color: colors.text.primary, fontWeight: '700' },
  emptyText: { fontSize: 13, color: colors.text.muted, fontStyle: 'italic' },
  actionBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
