/**
 * Fallback root component for EAS Build when expo/AppEntry.js is used instead of expo-router/entry.
 * Re-exports the expo-router app so the default Expo entry can resolve ../../App.
 */
import { ExpoRoot } from 'expo-router';

const ctx = require.context('./app', true, /\.(js|jsx|ts|tsx)$/);

export default function App() {
  return <ExpoRoot context={ctx} />;
}
