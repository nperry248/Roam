import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Check your email', 'We sent you a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <MapPin size={32} color="white" />
          </View>
          <Text style={styles.appName}>Roam</Text>
          <Text style={styles.tagline}>Your trips, all in one place.</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            {(['signin', 'signup'] as const).map((m) => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={styles.modeTab}>
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
                {mode === m && <View style={styles.modeUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  appName: { fontSize: 40, fontWeight: '800', color: colors.brand.primary, letterSpacing: -1 },
  tagline: { fontSize: 16, color: colors.text.secondary, marginTop: 4 },
  card: {
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  modeRow: { flexDirection: 'row', marginBottom: 24 },
  modeTab: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  modeText: { fontSize: 15, fontWeight: '600', color: colors.text.muted },
  modeTextActive: { color: colors.brand.primary },
  modeUnderline: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: colors.brand.primary, borderRadius: 1 },
  label: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 16, fontSize: 16, color: colors.text.primary,
  },
  button: {
    backgroundColor: colors.brand.primary, padding: 18,
    borderRadius: 14, alignItems: 'center', marginTop: 28,
    shadowColor: colors.brand.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
