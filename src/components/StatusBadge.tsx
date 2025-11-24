import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Status = 'ideated' | 'planned' | 'confirmed';

export default function StatusBadge({ status }: { status: Status }) {
  const colorSet = colors.status[status];

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg, borderColor: colorSet.border }]}>
      <Text style={[styles.text, { color: colorSet.text }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    margin: 4, // Added margin for the test screen
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});