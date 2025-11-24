import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Trash2, MapPin, Plus, Plane, Bed, Ticket, ExternalLink } from 'lucide-react-native';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import { db } from '../db/client';
import { trips, expenses, documents, Trip, Expense, Document } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

type RootStackParamList = {
  TripDetails: { tripId: number };
  AddExpense: { tripId: number };
  AddDocument: { tripId: number }; // Register new route param
};

type TripDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TripDetailsRouteProp = RouteProp<RootStackParamList, 'TripDetails'>;

export default function TripDetailsScreen() {
  const navigation = useNavigation<TripDetailsNavigationProp>();
  const route = useRoute<TripDetailsRouteProp>();
  const { tripId } = route.params;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);
  const [tripDocs, setTripDocs] = useState<Document[]>([]); // Docs State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const fetchData = async () => {
    const tripResult = await db.select().from(trips).where(eq(trips.id, tripId));
    setTrip(tripResult[0] || null);

    const expenseResult = await db.select().from(expenses).where(eq(expenses.tripId, tripId)).orderBy(desc(expenses.createdAt));
    setTripExpenses(expenseResult);

    // Fetch Documents
    const docResult = await db.select().from(documents).where(eq(documents.tripId, tripId));
    setTripDocs(docResult);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [tripId])
  );

  const saveBudget = async () => {
    const budgetCents = parseFloat(budgetInput) * 100;
    await db.update(trips).set({ budget: budgetCents }).where(eq(trips.id, tripId));
    setIsEditingBudget(false);
    fetchData();
  };

  const handleDelete = () => {
    Alert.alert("Delete Trip", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          await db.delete(trips).where(eq(trips.id, tripId));
          navigation.goBack();
        }
      }
    ]);
  };

  const handleStatusChange = async (newStatus: 'planned' | 'confirmed') => {
    await db.update(trips).set({ status: newStatus }).where(eq(trips.id, tripId));
    fetchData(); 
  };

  const openLink = (url: string | null) => {
    if (url) Linking.openURL(url).catch(err => Alert.alert("Error", "Cannot open link"));
  };

  if (!trip) return <View style={styles.container} />;

  const totalSpent = tripExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = trip.budget || 0;
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const progressColor = percentSpent > 100 ? '#EF4444' : percentSpent > 75 ? '#F59E0B' : '#10B981';

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.sectionHeaderRow}>
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
              // Select Icon based on type
              let Icon = Ticket;
              if (doc.type === 'transport') Icon = Plane;
              if (doc.type === 'stay') Icon = Bed;

              return (
                <TouchableOpacity 
                  key={doc.id} 
                  style={styles.docCard}
                  onPress={() => openLink(doc.link)}
                  disabled={!doc.link}
                >
                  <View style={styles.docIcon}>
                    <Icon size={20} color={colors.brand.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    {doc.subtitle && <Text style={styles.docSubtitle}>{doc.subtitle}</Text>}
                  </View>
                  {doc.link && <ExternalLink size={16} color={colors.text.muted} />}
                </TouchableOpacity>
              )
            })
          )}
        </View>

        <View style={[styles.sectionHeaderRow, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>BUDGET</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { tripId })}>
            <Plus size={20} color={colors.brand.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.budgetHeader}>
             <View>
                <Text style={styles.label}>TOTAL SPENT</Text>
                <Text style={styles.budgetValue}>${(totalSpent / 100).toFixed(2)}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>BUDGET</Text>
                {isEditingBudget ? (
                   <View style={styles.budgetInputRow}>
                     <TextInput 
                       value={budgetInput} 
                       onChangeText={setBudgetInput} 
                       style={styles.budgetInput} 
                       placeholder="0"
                       keyboardType="numeric"
                       autoFocus
                       onBlur={saveBudget}
                     />
                   </View>
                ) : (
                  <TouchableOpacity onPress={() => { setBudgetInput(((trip.budget || 0)/100).toString()); setIsEditingBudget(true); }}>
                    <Text style={[styles.budgetValue, { color: colors.text.secondary }]}>
                      ${(totalBudget / 100).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(percentSpent, 100)}%`, backgroundColor: progressColor }]} />
          </View>

          <View style={styles.expenseList}>
            {tripExpenses.length === 0 ? (
               <Text style={styles.emptyText}>No expenses logged yet.</Text>
            ) : (
               tripExpenses.slice(0, 3).map(exp => (
                 <View key={exp.id} style={styles.expenseRow}>
                    <Text style={styles.expenseTitle}>{exp.title}</Text>
                    <Text style={styles.expenseAmount}>-${(exp.amount / 100).toFixed(2)}</Text>
                 </View>
               ))
            )}
            {tripExpenses.length > 3 && (
              <Text style={styles.moreExpenses}>+ {tripExpenses.length - 3} more</Text>
            )}
          </View>
        </View>

        {/* --- Action Buttons --- */}
        {trip.status === 'ideated' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.status.planned.text }]}
            onPress={() => handleStatusChange('planned')}
          >
            <Text style={styles.actionButtonText}>Start Planning</Text>
          </TouchableOpacity>
        )}
        
        {trip.status === 'planned' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.status.confirmed.text }]}
            onPress={() => handleStatusChange('confirmed')}
          >
            <Text style={styles.actionButtonText}>Confirm Trip</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  iconButton: { padding: 8 },
  content: { padding: 24, paddingBottom: 100 },
  titleSection: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary, marginVertical: 12 },
  subtitle: { fontSize: 18, color: colors.text.secondary, marginLeft: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text.primary, letterSpacing: 0.5 },
  
  // Wallet Styles
  docsList: { gap: 12 },
  docCard: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, 
    borderWidth: 1, borderColor: '#E2E8F0', gap: 12 
  },
  docIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  docTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  docSubtitle: { fontSize: 12, color: colors.text.secondary },
  
  card: { backgroundColor: colors.brand.background, padding: 20, borderRadius: 20, marginBottom: 30 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1, marginBottom: 4 },
  budgetValue: { fontSize: 24, fontWeight: '800', color: colors.text.primary },
  budgetInputRow: { borderBottomWidth: 1, borderColor: colors.brand.primary, minWidth: 60 },
  budgetInput: { fontSize: 24, fontWeight: '800', color: colors.text.primary, textAlign: 'right', padding: 0 },
  
  progressBarBg: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 20 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  
  expenseList: { gap: 12 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expenseTitle: { fontSize: 14, color: colors.text.secondary, fontWeight: '500' },
  expenseAmount: { fontSize: 14, color: colors.text.primary, fontWeight: '700' },
  emptyText: { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' },
  moreExpenses: { fontSize: 12, color: colors.brand.primary, fontWeight: '600', marginTop: 4 },

  actionButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});