import { Stack, router } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Roam',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/session/new')}
            >
              <Text style={styles.headerButtonText}>+</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="session/[id]"
        options={{
          title: 'New Session',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>⎘</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});
