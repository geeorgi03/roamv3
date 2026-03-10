/**
 * Fallback root for EAS Build when the project root is the monorepo root.
 * expo/AppEntry.js looks for ../../App from node_modules/expo.
 */
import { ExpoRoot } from 'expo-router';

const ctx = require.context('./apps/mobile/app', true, /\.(js|jsx|ts|tsx)$/);

export default function App() {
  return <ExpoRoot context={ctx} />;
}
