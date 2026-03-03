import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, Utensils, Bus, Bed, Ticket, CreditCard } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

type ParamList = { AddExpense: { tripId: string } };

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'transport', label: 'Travel', icon: Bus },
  { id: 'stay', label: 'Stay', icon: Bed },
  { id: 'activity', label: 'Fun', icon: Ticket },
  { id: 'other', label: 'Other', icon: CreditCard },
];

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AddExpense'>>();
  const { tripId } = route.params;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !amount) { Alert.alert('Missing Info', 'Please enter a description and amount.'); return; }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        trip_id: tripId,
        title,
        amount: Math.round(parseFloat(amount) * 100),
        category,
      });
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save expense.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Expense</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <Text style={styles.amountLabel}>AMOUNT</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>$</Text>
          <TextInput style={styles.amountInput} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} autoFocus placeholderTextColor={colors.text.muted} />
        </View>
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput style={styles.input} placeholder="e.g. Dinner at Mario's" value={title} onChangeText={setTitle} placeholderTextColor={colors.text.muted} />
        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catBtn, category === cat.id && styles.catBtnActive]} onPress={() => setCategory(cat.id)}>
              <cat.icon size={20} color={category === cat.id ? 'white' : colors.text.secondary} />
              <Text style={[styles.catText, category === cat.id && { color: 'white' }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Expense</Text>}
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
  amountLabel: { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  amountRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  currency: { fontSize: 32, fontWeight: '700', color: colors.text.primary, marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '800', color: colors.brand.primary, minWidth: 100, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBtn: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', minWidth: 68, gap: 4 },
  catBtnActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  catText: { fontSize: 10, fontWeight: '600', color: colors.text.secondary },
  saveBtn: { backgroundColor: colors.brand.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40, shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
