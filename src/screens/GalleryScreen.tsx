import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // 1. Import this
import { Folder } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { trips, Trip } from '../db/schema';
import { desc } from 'drizzle-orm';

// 2. Define the Navigation Types
type RootStackParamList = {
  TripGallery: { tripId: number; title: string };
};

type GalleryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GalleryScreen() {
  // 3. Apply the type to the hook
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  const fetchTrips = async () => {
    try {
      // Get all trips to show as folders
      const result = await db.select().from(trips).orderBy(desc(trips.startDate));
      setAllTrips(result);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memories</Text>
        <Text style={styles.subtitle}>Select a trip to view photos</Text>
      </View>

      <FlatList
        data={allTrips}
        keyExtractor={item => item.id.toString()}
        numColumns={2} // Grid of folders
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.folderCard}
            // 4. Now TypeScript allows passing the object safely
            onPress={() => navigation.navigate('TripGallery', { tripId: item.id, title: item.title })}
          >
            <View style={styles.folderIcon}>
              <Folder size={32} color={colors.brand.primary} fill={colors.status.planned.bg} />
            </View>
            <Text style={styles.folderTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.folderDate}>{item.destination}</Text>
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
  subtitle: { fontSize: 16, color: colors.text.secondary, marginTop: 4 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  folderCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  folderIcon: { marginBottom: 12 },
  folderTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  folderDate: { fontSize: 12, color: colors.text.secondary, marginTop: 4, textAlign: 'center' }
});