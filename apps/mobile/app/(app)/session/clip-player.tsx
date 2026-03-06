import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, AVPlaybackStatus } from 'expo-av';
import Slider from '@react-native-community/slider';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { theme } from '../../../lib/theme';
import { useClips } from '../../../lib/hooks/useClips';
import { TagSheet } from '../../../components/TagSheet';
import BottomSheet, { type BottomSheetRef } from '@gorhom/bottom-sheet';
import type { ClipRow } from '../../../lib/database';

type SessionParams = {
  sessionId?: string;
  clipIndex?: string;
};

type LibraryParams = {
  clipId?: string;
  mux_playback_id?: string;
  move_name?: string;
  style?: string;
  energy?: string;
};

type PlayerParams = SessionParams & LibraryParams;

export default function ClipPlayerScreen() {
  const { sessionId, clipIndex, mux_playback_id, move_name, style, energy } =
    useLocalSearchParams<PlayerParams>();
  const router = useRouter();

  const hasSessionContext = !!sessionId && !!clipIndex;

  const { clips } = useClips(hasSessionContext ? (sessionId as string) : null);

  const parsedIndex = parseInt((clipIndex as string) ?? '0', 10);
  const [currentIndex, setCurrentIndex] = useState(
    isNaN(parsedIndex) ? 0 : parsedIndex
  );
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState(1);
  const [displayClip, setDisplayClip] = useState<ClipRow | null>(null);
  const videoRef = useRef<Video>(null);
  const tagSheetRef = useRef<BottomSheetRef | null>(null);

  const clip = hasSessionContext ? clips[currentIndex] ?? null : null;

  useEffect(() => {
    if (!hasSessionContext) return;
    const safeIndex = Math.min(
      Math.max(0, isNaN(parsedIndex) ? 0 : parsedIndex),
      Math.max(0, clips.length - 1)
    );
    setCurrentIndex(safeIndex);
  }, [hasSessionContext, parsedIndex, clips.length]);

  useEffect(() => {
    if (!hasSessionContext) return;
    setDisplayClip(clip);
  }, [hasSessionContext, clip]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMillis(status.positionMillis);
    if (status.durationMillis) setDurationMillis(status.durationMillis);
    setPlaying(status.isPlaying);
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (playing) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
  };

  const handleSeekBack = async () => {
    if (!videoRef.current) return;
    const newPos = Math.max(0, positionMillis - 5000);
    await videoRef.current.setPositionAsync(newPos);
  };

  const handleSpeedToggle = async () => {
    if (!videoRef.current) return;
    const newRate = rate === 1 ? 0.5 : 1;
    setRate(newRate);
    await videoRef.current.setRateAsync(newRate, true);
  };

  const handleSliderComplete = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value);
  };

  const panGesture = Gesture.Pan().onEnd((e) => {
    const { translationX, translationY } = e;
    if (Math.abs(translationY) > 80 && translationY > 0) {
      router.back();
      return;
    }
    if (!hasSessionContext) return;
    if (Math.abs(translationX) > 60) {
      if (translationX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setPositionMillis(0);
      } else if (translationX < 0 && currentIndex < clips.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setPositionMillis(0);
      }
    }
  });

  const handleTagSaved = (updatedClip: ClipRow) => {
    setDisplayClip(updatedClip);
  };

  const hasLibraryClip = !hasSessionContext && !!mux_playback_id;

  if (!hasSessionContext && !hasLibraryClip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>No clip</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSessionContext && !clip) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>No clip</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSessionContext && clip!.upload_status !== 'ready') {
    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Processing…</Text>
            <Text style={styles.placeholderLabel}>{clip!.label ?? 'Clip'}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </GestureDetector>
    );
  }

  if (!hasSessionContext && hasLibraryClip) {
    const libraryMoveName = move_name ?? null;
    const libraryStyle = style ?? null;
    const libraryEnergy = energy ?? null;
    const showLibraryTags =
      !!libraryMoveName || !!libraryStyle || !!libraryEnergy;

    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          <Video
            key={mux_playback_id}
            ref={videoRef}
            source={{ uri: `https://stream.mux.com/${mux_playback_id}.m3u8` }}
            style={StyleSheet.absoluteFill}
            useNativeControls={false}
            resizeMode="contain"
            shouldPlay={playing}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationMillis || 1}
              value={positionMillis}
              onSlidingComplete={handleSliderComplete}
              minimumTrackTintColor={theme.textPrimary}
              maximumTrackTintColor={theme.textSecondary}
              thumbTintColor={theme.textPrimary}
            />
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>−5s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlayPause}
                style={styles.controlBtn}
              >
                <Text style={styles.controlBtnText}>
                  {playing ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSpeedToggle}
                style={styles.controlBtn}
              >
                <Text style={styles.controlBtnText}>{rate}×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {showLibraryTags ? (
              <>
                {libraryMoveName ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryMoveName}</Text>
                  </View>
                ) : null}
                {libraryStyle ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryStyle}</Text>
                  </View>
                ) : null}
                {libraryEnergy ? (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{libraryEnergy}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </GestureDetector>
    );
  }

  const showTags =
    !!displayClip &&
    (displayClip.move_name || displayClip.style || displayClip.energy);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Video
          key={clip!.local_id}
          ref={videoRef}
          source={{ uri: `https://stream.mux.com/${clip!.mux_playback_id}.m3u8` }}
          style={StyleSheet.absoluteFill}
          useNativeControls={false}
          resizeMode="contain"
          shouldPlay={playing}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={durationMillis || 1}
            value={positionMillis}
            onSlidingComplete={handleSliderComplete}
            minimumTrackTintColor={theme.textPrimary}
            maximumTrackTintColor={theme.textSecondary}
            thumbTintColor={theme.textPrimary}
          />
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleSeekBack} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>−5s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              <Text style={styles.controlBtnText}>
                {playing ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSpeedToggle}
              style={styles.controlBtn}
            >
              <Text style={styles.controlBtnText}>{rate}×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {showTags ? (
            <>
              {displayClip!.move_name ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.move_name}</Text>
                </View>
              ) : null}
              {displayClip!.style ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.style}</Text>
                </View>
              ) : null}
              {displayClip!.energy ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{displayClip!.energy}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <TouchableOpacity onPress={() => tagSheetRef.current?.snapToIndex(0)}>
              <Text style={styles.addTagsText}>Add tags →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TagSheet
        clip={displayClip}
        bottomSheetRef={tagSheetRef}
        onSaved={handleTagSaved}
        musicTrackBpm={undefined}
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  placeholderLabel: {
    fontSize: 14,
    color: theme.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  controlBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  controlBtnText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  tagsRow: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tagPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagPillText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  addTagsText: {
    color: theme.untaggedText,
    fontSize: 14,
    fontWeight: '600',
  },
});
