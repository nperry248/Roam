import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, Dimensions, Modal, StatusBar } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, Camera, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { uploadImage, deleteImage } from '../lib/storage';
import { Photo } from '../db/schema';

type ParamList = { TripGallery: { tripId: string; title: string } };

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH / 3;

export default function TripGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'TripGallery'>>();
  const { tripId, title } = route.params;
  const [gallery, setGallery] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const { data } = await supabase.from('photos').select('*').eq('trip_id', tripId).order('created_at', { ascending: false });
    if (data) setGallery(data as Photo[]);
  };

  useFocusEffect(useCallback(() => { fetchPhotos(); }, [tripId]));

  const handleAddPhoto = () => {
    Alert.alert('Add Memory', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'], allowsMultipleSelection: true });
    if (result.canceled) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await Promise.all(result.assets.map(async (asset) => {
        const url = await uploadImage('trip-photos', asset.uri);
        await supabase.from('photos').insert({ user_id: user!.id, trip_id: tripId, url });
      }));
      fetchPhotos();
    } catch (e) {
      Alert.alert('Error', 'Could not upload photo(s).');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert('Delete Photo', 'Remove this memory?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await Promise.all([
          supabase.from('photos').delete().eq('id', photo.id),
          deleteImage('trip-photos', photo.url),
        ]);
        fetchPhotos();
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleAddPhoto} style={styles.iconBtn} disabled={uploading}>
          <Plus color={uploading ? colors.text.muted : colors.brand.primary} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={gallery}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Camera size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>No photos yet.</Text>
            <Text style={styles.emptySubText}>Tap + to add your first memory.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imgContainer}
            onPress={() => setLightbox(item.url)}
            onLongPress={() => handleDeletePhoto(item)}
          >
            <Image source={{ uri: item.url }} style={styles.img} contentFit="cover" transition={200} />
          </TouchableOpacity>
        )}
      />

      {/* Lightbox */}
      <Modal visible={!!lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <StatusBar hidden />
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightbox(null)}>
            <X color="white" size={28} />
          </TouchableOpacity>
          {lightbox && <Image source={{ uri: lightbox }} style={styles.lightboxImg} contentFit="contain" />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  iconBtn: { padding: 8 },
  grid: { paddingBottom: 100 },
  imgContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, padding: 1 },
  img: { flex: 1, backgroundColor: '#F1F5F9' },
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text.secondary },
  emptySubText: { fontSize: 14, color: colors.text.muted },
  lightbox: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  lightboxImg: { width: '100%', height: '100%' },
});
