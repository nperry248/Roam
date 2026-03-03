import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Bot, User } from 'lucide-react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { GEMINI_API_KEY } from '../../keys';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

type Message = { id: string; text: string; sender: 'user' | 'ai'; timestamp: number };
type HistoryEntry = { role: 'user' | 'model'; parts: { text: string }[] };

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "Hey! I'm Roam AI. I know all about your upcoming trips. Ask me for recommendations, packing tips, or budget advice!",
    sender: 'ai',
    timestamp: Date.now(),
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef<HistoryEntry[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const getSystemContext = async () => {
    const { data } = await supabase.from('trips').select('title, destination, status, start_date, end_date');
    if (!data?.length) return 'The user has no trips yet.';
    return data.map(t => `- ${t.title} to ${t.destination} (${t.status}) from ${t.start_date ?? '?'} to ${t.end_date ?? '?'}`).join('\n');
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText.trim();
    const userMsg: Message = { id: Date.now().toString(), text: userText, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const systemContext = await getSystemContext();
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `You are Roam AI, a friendly travel assistant. The user's trips:\n${systemContext}\n\nBe concise, helpful, and use their trip details when relevant.`,
      });

      const chat = model.startChat({ history: historyRef.current });
      const result = await chat.sendMessage(userText);
      const aiText = result.response.text();

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: aiText }] },
      ];

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai', timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "I'm having trouble connecting right now. Try again in a moment.", sender: 'ai', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && <View style={styles.avatar}><Bot size={14} color="white" /></View>}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
        </View>
        {isUser && <View style={[styles.avatar, { backgroundColor: colors.text.secondary }]}><User size={14} color="white" /></View>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Travel Assistant</Text></View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your trips..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.text.muted}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={[styles.sendBtn, (!inputText.trim() || isLoading) && { opacity: 0.5 }]} onPress={handleSend} disabled={!inputText.trim() || isLoading}>
            {isLoading ? <ActivityIndicator size="small" color="white" /> : <Send size={18} color="white" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  listContent: { padding: 16, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: colors.brand.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText: { fontSize: 15, lineHeight: 21 },
  userText: { color: 'white' },
  aiText: { color: colors.text.primary },
  inputRow: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E2E8F0', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
});
