import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { theme } from '../lib/theme';
import { supabase } from '../lib/supabase';

export interface NotePinSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  /** Session id required to upload audio to a portable storage path. */
  sessionId?: string;
  timecode: string;
  sectionName: string;
  initialText?: string | null;
  initialAudioUri?: string | null;
  onSave: (data: { text?: string; audioUri?: string }) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

/**
 * Upload a locally-recorded audio file to Supabase Storage so the returned
 * path is stable across devices. Returns the storage path on success, or
 * null when Supabase is unavailable / upload fails (caller falls back to URI).
 */
async function uploadNoteAudio(localUri: string, sessionId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const noteId = crypto.randomUUID();
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const storagePath = `voice-notes/${session.user.id}/${sessionId}/${noteId}.${ext}`;

    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('audio')
      .upload(storagePath, blob, { contentType: `audio/${ext}` });

    if (error) return null;
    return storagePath;
  } catch {
    return null;
  }
}

export function NotePinSheet({
  bottomSheetRef,
  sessionId,
  timecode,
  sectionName,
  initialText,
  initialAudioUri,
  onSave,
  onDelete,
}: NotePinSheetProps) {
  const snapPoints = useMemo(() => ['60%'], []);
  const [text, setText] = useState(initialText ?? '');
  const [audioUri, setAudioUri] = useState<string | null>(initialAudioUri ?? null);
  const [saving, setSaving] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    setText(initialText ?? '');
    setAudioUri(initialAudioUri ?? null);
  }, [initialText, initialAudioUri, timecode, sectionName]);

  const startRecording = async () => {
    if (recordingBusy || recording) return;
    setRecordingBusy(true);
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const r = new Audio.Recording();
      await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await r.startAsync();
      if (mountedRef.current) setRecording(r);
    } finally {
      if (mountedRef.current) setRecordingBusy(false);
    }
  };

  const stopRecording = async () => {
    if (!recording || recordingBusy) return;
    setRecordingBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri && mountedRef.current) setAudioUri(uri);
      if (mountedRef.current) setRecording(null);
    } finally {
      if (mountedRef.current) setRecordingBusy(false);
    }
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    const hasText = trimmed.length > 0;
    const hasAudio = !!audioUri;
    if (!hasText && !hasAudio) {
      Toast.show({ type: 'error', text1: 'Add a note or record audio' });
      return;
    }
    setSaving(true);
    try {
      const payload: { text?: string; audioUri?: string } = {};
      if (hasText) payload.text = trimmed;
      if (audioUri) {
        // Upload local recordings to durable storage so audio_storage_path is
        // portable across devices. Falls back to the local URI on failure.
        let finalUri = audioUri;
        if (sessionId && audioUri.startsWith('file://')) {
          const canonicalPath = await uploadNoteAudio(audioUri, sessionId);
          if (canonicalPath) finalUri = canonicalPath;
        }
        payload.audioUri = finalUri;
      }
      await onSave(payload);
      bottomSheetRef.current?.close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef as React.RefObject<BottomSheet>}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Pin a note</Text>
        <Text style={styles.meta}>
          {sectionName} · {timecode}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Write a note…"
          placeholderTextColor={theme.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={recording ? stopRecording : startRecording}
            disabled={recordingBusy || saving}
          >
            {recordingBusy ? (
              <ActivityIndicator color={theme.textPrimary} size="small" />
            ) : (
              <Text style={styles.micBtnText}>{recording ? 'Stop' : '🎙 Record'}</Text>
            )}
          </TouchableOpacity>

          {audioUri ? (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setAudioUri(null)}
              disabled={saving}
            >
              <Text style={styles.clearBtnText}>Clear audio</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.textPrimary} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={async () => {
              await onDelete();
              bottomSheetRef.current?.close();
            }}
            disabled={saving}
          >
            <Text style={styles.deleteBtnText}>Delete note</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.background },
  handle: { backgroundColor: theme.textSecondary },
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  title: { color: theme.textPrimary, fontSize: 18, fontWeight: '800' },
  meta: { color: theme.textSecondary, fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: '#1B1B22',
    borderWidth: 1,
    borderColor: '#2A2A32',
    borderRadius: theme.borderRadius,
    padding: 12,
    color: theme.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  micBtn: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: theme.textSecondary,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  micBtnActive: { borderColor: '#C8F135' },
  micBtnText: { color: theme.textPrimary, fontWeight: '700' },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    backgroundColor: 'transparent',
  },
  clearBtnText: { color: '#4ECDC4', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#C8F135',
    borderRadius: theme.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#0b0b0f', fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e57373',
    marginTop: 4,
  },
  deleteBtnText: { color: '#e57373', fontWeight: '800' },
});
