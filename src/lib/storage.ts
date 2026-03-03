import { supabase } from './supabase';

export async function uploadImage(bucket: 'trip-covers' | 'trip-photos', localUri: string): Promise<string> {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase().replace(/\?.*$/, '');
  const fileName = `${Date.now()}.${ext}`;
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

export async function deleteImage(bucket: 'trip-covers' | 'trip-photos', url: string) {
  const path = url.split(`${bucket}/`)[1];
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
