import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('roam.db');

// Confirm database opens successfully
db.execSync('SELECT 1');
