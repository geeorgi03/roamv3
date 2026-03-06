import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';

export interface CaptureSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  onRecord: () => void;
  onGallery: () => void;
}

export function CaptureSheet({
  bottomSheetRef,
  onRecord,
  onGallery,
}: CaptureSheetProps) {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['35%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={onRecord}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>📷</Text>
            <Text style={styles.cardTitle}>Record now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={onGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>🖼</Text>
            <Text style={styles.cardTitle}>Import from gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.background,
  },
  handle: {
    backgroundColor: theme.textSecondary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
});
