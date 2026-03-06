import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video } from 'expo-av';
import { theme } from '../../../lib/theme';
import { storage } from '../../../lib/storage';

const PENDING_CLIP_KEY = 'pending_camera_clip';

export default function CameraScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);

  const handleRecordPress = async () => {
    if (!cameraRef.current || !sessionId) return;
    if (!isRecording) {
      try {
        const promise = cameraRef.current.recordAsync();
        recordingPromiseRef.current = promise;
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    } else {
      if (cameraRef.current.stopRecording && recordingPromiseRef.current) {
        cameraRef.current.stopRecording();
        const result = await recordingPromiseRef.current;
        if (result?.uri) setRecordedUri(result.uri);
        recordingPromiseRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (recordedUri && sessionId) {
      storage.set(PENDING_CLIP_KEY, JSON.stringify({ sessionId, uri: recordedUri }));
      router.back();
    }
  };

  const handleRetake = () => {
    setRecordedUri(null);
  };

  if (!cameraPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recordedUri) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: recordedUri }}
          style={StyleSheet.absoluteFill}
          useNativeControls={false}
          shouldPlay
          isLooping
          resizeMode="contain"
        />
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.outlineButton} onPress={handleRetake}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        mode="video"
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={handleRecordPress}
          activeOpacity={0.8}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: theme.accent,
    borderRadius: theme.borderRadius,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: theme.accent,
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  outlineButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius,
    borderWidth: 1,
    borderColor: theme.textSecondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  recordButtonActive: {
    backgroundColor: '#e57373',
  },
  previewControls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});
