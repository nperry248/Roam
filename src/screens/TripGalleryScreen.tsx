import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { photos, Photo } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

type ParamList = {
  TripGallery: { tripId: number; title: string };
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_COUNT = 3;
const IMAGE_SIZE = SCREEN_WIDTH / COLUMN_COUNT;

export default function TripGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'TripGallery'>>();
  const { tripId, title } = route.params;
  const [gallery, setGallery] = useState<Photo[]>([]);

  // Fetch photos for this specific trip
  const fetchPhotos = async () => {
    try {
      const result = await db.select().from(photos).where(eq(photos.tripId, tripId)).orderBy(desc(photos.id));
      setGallery(result);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, [tripId])
  );

  // Add Photo Logic
  const handleAddPhoto = async () => {
    // Ask user: Camera or Library?
    Alert.alert(
      "Add Memory",
      "Choose a source",
      [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
            if (!result.canceled) savePhoto(result.assets[0].uri);
          }
        },
        {
          text: "Library",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
            if (!result.canceled) savePhoto(result.assets[0].uri);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const savePhoto = async (uri: string) => {
    await db.insert(photos).values({
      tripId,
      uri,
      createdAt: Date.now(),
    });
    fetchPhotos();
  };

  const handleDeletePhoto = async (photoId: number) => {
    Alert.alert("Delete Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          await db.delete(photos).where(eq(photos.id, photoId));
          fetchPhotos();
        } 
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleAddPhoto} style={styles.iconButton}>
          <Plus color={colors.brand.primary} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={gallery}
        keyExtractor={item => item.id.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Camera size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No photos yet.</Text>
            <Text style={styles.emptySubText}>Tap + to add your first memory.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onLongPress={() => handleDeletePhoto(item.id)}
            style={styles.imageContainer}
          >
            <Image 
              source={{ uri: item.uri }} 
              style={styles.image} 
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  iconButton: { padding: 8 },
  grid: { paddingBottom: 100 },
  imageContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, padding: 1 },
  image: { flex: 1, backgroundColor: '#F1F5F9' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text.secondary },
  emptySubText: { fontSize: 14, color: colors.text.muted }
});