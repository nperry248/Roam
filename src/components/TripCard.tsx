import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin } from 'lucide-react-native';
import StatusBadge from './StatusBadge';
import { colors } from '../theme/colors';

type TripProps = {
  title: string;
  destination: string;
  dates: string;
  status: 'ideated' | 'planned' | 'confirmed';
  coverImageUrl?: string | null;
  onPress?: () => void;
};

export default function TripCard({ title, destination, dates, status, coverImageUrl, onPress }: TripProps) {
  const isIdeated = status === 'ideated';

  if (coverImageUrl) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.imageCard}>
        <ImageBackground source={{ uri: coverImageUrl }} style={styles.imageBackground} imageStyle={{ borderRadius: 16 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.gradient}
          >
            <View style={styles.imageBadgeRow}>
              <StatusBadge status={status} />
            </View>
            <View style={styles.imageContent}>
              <Text style={styles.imageTitle} numberOfLines={1}>{title}</Text>
              <View style={styles.imageMetaRow}>
                <MapPin size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.imageMeta}>{destination}</Text>
                <Text style={styles.imageMeta}>  ·  </Text>
                <Calendar size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.imageMeta}>{dates}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        isIdeated ? styles.dashedBorder : styles.solidBorder,
        isIdeated && { borderColor: colors.status.ideated.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <StatusBadge status={status} />
        {isIdeated && <Text style={{ fontSize: 20 }}>💭</Text>}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <MapPin size={13} color={colors.text.secondary} />
        <Text style={styles.metaText}>{destination}</Text>
      </View>
      <View style={[styles.metaRow, { marginTop: 4 }]}>
        <Calendar size={13} color={colors.text.secondary} />
        <Text style={styles.metaText}>{dates}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Image card
  imageCard: { borderRadius: 16, marginBottom: 16, overflow: 'hidden', height: 160 },
  imageBackground: { flex: 1 },
  gradient: {
    flex: 1, borderRadius: 16, padding: 16,
    justifyContent: 'space-between',
  },
  imageBadgeRow: { alignSelf: 'flex-start' },
  imageContent: {},
  imageTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 4 },
  imageMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  imageMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Plain card
  card: {
    backgroundColor: colors.brand.surface,
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2,
  },
  solidBorder: {
    borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  dashedBorder: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
});
