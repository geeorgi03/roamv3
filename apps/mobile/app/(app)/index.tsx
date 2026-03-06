import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../lib/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>No sessions yet</Text>
        <Text style={styles.subtitle}>Start your first session</Text>
      </View>
      {/* TODO: render sessions list (T6) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});
