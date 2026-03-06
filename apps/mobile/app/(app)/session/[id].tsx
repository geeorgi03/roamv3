import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../../lib/theme';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Session workspace — clips will appear here
        </Text>
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('Capture coming soon')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  fabIcon: {
    fontSize: 28,
    color: theme.textPrimary,
    fontWeight: '300',
  },
});
