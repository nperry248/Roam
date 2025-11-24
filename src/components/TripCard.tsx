import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import StatusBadge from './StatusBadge';
import { colors } from '../theme/colors';

type TripProps = {
  title: string;
  dates: string;
  status: 'ideated' | 'planned' | 'confirmed';
  onPress?: () => void; // Add this prop
};

export default function TripCard({ title, dates, status, onPress }: TripProps) {
  const isIdeated = status === 'ideated';

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress} // Hook it up here
      style={[
        styles.card,
        isIdeated ? styles.dashedBorder : styles.solidBorder,
        isIdeated && { borderColor: colors.status.ideated.border }
      ]}
    >
      <View style={styles.header}>
        <StatusBadge status={status} />
        {isIdeated && <Text style={{ fontSize: 20 }}>💭</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.dateRow}>
        <Calendar size={14} color={colors.text.secondary} />
        <Text style={styles.dateText}>{dates}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  solidBorder: {
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dashedBorder: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, 
  },
  dateText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});