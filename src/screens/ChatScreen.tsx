import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Bot, User } from 'lucide-react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { colors } from '../theme/colors';
import { db } from '../db/client';
import { trips } from '../db/schema';

import { GEMINI_API_KEY } from '../../keys';

// --- CONFIG ---
// Replace this with your actual API Key later!
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm Roam AI. I know all about your upcoming trips. Ask me for recommendations, packing tips, or budget advice!",
      sender: 'ai',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 1. Get Context (Trips)
  const getSystemContext = async () => {
    const allTrips = await db.select().from(trips);
    const tripsContext = allTrips.map(t => 
      `- ${t.title} to ${t.destination} (${t.status}) from ${t.startDate || '?'} to ${t.endDate || '?'}`
    ).join('\n');

    return `
      You are Roam AI, a helpful travel assistant for a study abroad student.
      
      Here are the user's current trips:
      ${tripsContext}

      When answering:
      - Be concise and friendly.
      - Use their specific trip details (dates, locations) in your advice.
      - If they ask about a location not in the list, help them plan it as a new "Ideated" trip.
    `;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    // Optimistic Update
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Build Prompt
      const context = await getSystemContext();
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // 3. Send to Gemini
      // Note: In production, we'd manage full chat history here.
      // For this MVP, we send context + latest question.
      const prompt = `${context}\n\nUser: ${userMsg.text}\nAI:`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'ai',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the travel grid right now. Check your API key!",
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageRow, 
        isUser ? styles.userRow : styles.aiRow
      ]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Bot size={16} color="white" />
          </View>
        )}
        <View style={[
          styles.bubble, 
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.aiText
          ]}>{item.text}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.text.secondary }]}>
            <User size={16} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your trips..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.text.muted}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.disabledButton]} 
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand.background },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  listContent: { padding: 16, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: 'white' },
  aiText: { color: colors.text.primary },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  }
});