/**
 * Fallback root component for EAS Build when expo/AppEntry.js is used instead of expo-router/entry.
 * Re-exports the expo-router app so the default Expo entry can resolve ../../App.
 */
import { ExpoRoot } from 'expo-router';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): unknown;
};

export default function App() {
  const ctx = require.context('./app', true, /\.(js|jsx|ts|tsx)$/ as any) as any;
  return <ExpoRoot context={ctx} />;
}
