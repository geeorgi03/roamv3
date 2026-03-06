import { Stack } from 'expo-router';

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Roam' }} />
      <Stack.Screen name="library" options={{ title: 'Library' }} />
      <Stack.Screen
        name="session/[id]"
        options={{
          title: 'New Session',
        }}
      />
      <Stack.Screen
        name="session/clip-player"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
