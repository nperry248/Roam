import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { X, Utensils, Bus, Bed, Ticket, CreditCard } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { expenses } from '../db/schema';

type ParamList = {
  AddExpense: { tripId: number };
};

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
    if (!title || !amount) {
      Alert.alert("Missing Info", "Please enter a description and amount.");
      return;
    }

    const costInCents = parseFloat(amount) * 100;

    setIsLoading(true);
    try {
      await db.insert(expenses).values({
        tripId,
        title,
        amount: Math.round(costInCents),
        category,
        createdAt: Date.now(),
      });
      navigation.goBack(); 
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save expense.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Expense</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X color={colors.text.secondary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.amountLabel}>AMOUNT</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput 
            style={styles.amountInput} 
            placeholder="0.00" 
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>

        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Dinner at Mario's" 
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.catButton, category === cat.id && styles.catButtonActive]}
              onPress={() => setCategory(cat.id)}
            >
              <cat.icon size={20} color={category === cat.id ? 'white' : colors.text.secondary} />
              <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save Expense</Text>
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
  amountLabel: { fontSize: 12, fontWeight: '700', color: colors.text.muted, alignSelf: 'center', marginBottom: 8 },
  amountInputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: colors.text.primary, marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '800', color: colors.brand.primary, minWidth: 100, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', minWidth: 70, gap: 4 },
  catButtonActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  catText: { fontSize: 10, fontWeight: '600', color: colors.text.secondary },
  catTextActive: { color: 'white' },
  saveButton: { backgroundColor: colors.brand.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});