import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Folder } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { Trip } from '../db/schema';

type Nav = NativeStackNavigationProp<{ TripGallery: { tripId: string; title: string } }>;

export default function GalleryScreen() {
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<(Trip & { photo_count: number })[]>([]);

  const fetchTrips = async () => {
    const { data: tripsData } = await supabase.from('trips').select('*').order('start_date', { ascending: false });
    if (!tripsData) return;

    const withCounts = await Promise.all(
      (tripsData as Trip[]).map(async t => {
        const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('trip_id', t.id);
        return { ...t, photo_count: count ?? 0 };
      })
    );
    setTrips(withCounts);
  };

  useFocusEffect(useCallback(() => { fetchTrips(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memories</Text>
        <Text style={styles.subtitle}>Select a trip to view photos</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No trips yet.</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TripGallery', { tripId: item.id, title: item.title })}
          >
            {item.cover_image_url ? (
              <ImageBackground source={{ uri: item.cover_image_url }} style={styles.cardImage} imageStyle={{ borderRadius: 14 }}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={styles.cardGradient}>
                  <Text style={styles.cardTitleImg} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardCountImg}>{item.photo_count} photo{item.photo_count !== 1 ? 's' : ''}</Text>
                </LinearGradient>
              </ImageBackground>
            ) : (
              <View style={styles.cardPlain}>
                <View style={styles.folderIcon}>
                  <Folder size={30} color={colors.brand.primary} fill={colors.status.planned.bg} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.destination}</Text>
                <Text style={styles.cardCount}>{item.photo_count} photo{item.photo_count !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: { padding: 24 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary },
  subtitle: { fontSize: 15, color: colors.text.secondary, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', height: 150, marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  cardImage: { flex: 1 },
  cardGradient: { flex: 1, justifyContent: 'flex-end', padding: 10 },
  cardTitleImg: { fontSize: 14, fontWeight: '700', color: 'white' },
  cardCountImg: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cardPlain: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', gap: 4 },
  folderIcon: { marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  cardSub: { fontSize: 11, color: colors.text.secondary, textAlign: 'center' },
  cardCount: { fontSize: 11, color: colors.brand.primary, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.text.muted, fontSize: 15 },
});
