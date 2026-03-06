import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import { theme } from '../lib/theme';
import { useSession } from '../lib/hooks/useSession';
import { updateClipTags } from '../lib/database';
import type { ClipRow } from '../lib/database';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const STYLES = ['Hip-hop', 'Contemporary', 'Ballet', 'Jazz', 'Fusion', 'Other'] as const;
const ENERGY_LEVELS = ['Low', 'Medium', 'High', 'Explosive'] as const;
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export interface TagSheetProps {
  clip: ClipRow | null;
  bottomSheetRef: React.RefObject<BottomSheetRef | null>;
  onSaved: (updatedClip: ClipRow) => void;
  musicTrackBpm?: number | null;
}

export function TagSheet({
  clip,
  bottomSheetRef,
  onSaved,
  musicTrackBpm,
}: TagSheetProps) {
  const { session } = useSession();
  const [moveName, setMoveName] = useState('');
  const [style, setStyle] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [bpm, setBpm] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clip) {
      setMoveName(clip.move_name ?? '');
      setStyle(clip.style ?? null);
      setEnergy(clip.energy ?? null);
      setDifficulty(clip.difficulty ?? null);
      setBpm(clip.bpm != null ? String(clip.bpm) : (musicTrackBpm != null ? String(musicTrackBpm) : ''));
      setNotes(clip.notes ?? '');
      setError(null);
    }
  }, [clip, musicTrackBpm]);

  const handleSave = async () => {
    if (!clip?.server_id || !session?.access_token) return;
    setError(null);
    setLoading(true);
    try {
      const body = {
        move_name: moveName.trim() || null,
        style,
        energy,
        difficulty,
        bpm: bpm.trim() ? parseInt(bpm, 10) : null,
        notes: notes.trim() || null,
      };
      const res = await fetch(`${API_BASE}/clips/${clip.server_id}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      const tags = {
        move_name: body.move_name,
        style: body.style,
        energy: body.energy,
        difficulty: body.difficulty,
        bpm: body.bpm,
        notes: body.notes,
      };
      updateClipTags(clip.local_id, tags);
      onSaved({ ...clip, ...tags });
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save tags');
    } finally {
      setLoading(false);
    }
  };

  if (!clip) {
    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        backgroundStyle={styles.sheet}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.content} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['80%']}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Edit tags</Text>

        <Text style={styles.label}>Move name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Shoulder roll into freeze"
          placeholderTextColor={theme.textSecondary}
          value={moveName}
          onChangeText={setMoveName}
          editable={!loading}
        />

        <Text style={styles.label}>Style</Text>
        <View style={styles.chipRow}>
          {STYLES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, style === s && styles.chipSelected]}
              onPress={() => setStyle(s)}
            >
              <Text style={[styles.chipText, style === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Energy</Text>
        <View style={styles.chipRow}>
          {ENERGY_LEVELS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, energy === e && styles.chipSelected]}
              onPress={() => setEnergy(e)}
            >
              <Text style={[styles.chipText, energy === e && styles.chipTextSelected]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTY_LEVELS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, difficulty === d && styles.chipSelected]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={[styles.chipText, difficulty === d && styles.chipTextSelected]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>BPM</Text>
        <TextInput
          style={styles.input}
          placeholder="BPM"
          placeholderTextColor={theme.textSecondary}
          value={bpm}
          onChangeText={setBpm}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes"
          placeholderTextColor={theme.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  chipSelected: {
    borderColor: theme.untaggedText,
    backgroundColor: theme.untaggedBg,
  },
  chipText: {
    fontSize: 14,
    color: theme.textPrimary,
  },
  chipTextSelected: {
    color: theme.untaggedText,
    fontWeight: '600',
  },
  errorText: {
    color: '#e57373',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: theme.accent,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
