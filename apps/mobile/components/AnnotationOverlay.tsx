import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type { ClipAnnotation, AnnotationType } from '@roam/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AnnotationOverlayProps {
  annotations: ClipAnnotation[];
  frameWidth: number;
  frameHeight: number;
  activeTool: AnnotationType;
  onPlaceText: (x: number, y: number, text: string) => void;
  onPlaceArrow: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceCircle: (x: number, y: number, r: number) => void;
}

export function AnnotationOverlay({
  annotations,
  frameWidth,
  frameHeight,
  activeTool,
  onPlaceText,
  onPlaceArrow,
  onPlaceCircle,
}: AnnotationOverlayProps) {
  const [textModal, setTextModal] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [circleStart, setCircleStart] = useState<{ x: number; y: number } | null>(null);
  const [circleRadius, setCircleRadius] = useState(0);
  const circleRadiusRef = useRef(0);

  const handlePress = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    const x = e.nativeEvent.locationX / frameWidth;
    const y = e.nativeEvent.locationY / frameHeight;
    if (activeTool === 'text') {
      setTextModal({ x, y });
      setTextValue('');
    } else if (activeTool === 'arrow') {
      if (!arrowStart) {
        setArrowStart({ x, y });
      } else {
        onPlaceArrow(arrowStart.x, arrowStart.y, x, y);
        setArrowStart(null);
      }
    } else if (activeTool === 'circle') {
      if (!circleStart) {
        setCircleStart({ x, y });
        setCircleRadius(0);
      }
    }
  };

  circleRadiusRef.current = circleRadius;

  const panGesture = Gesture.Pan()
    .enabled(activeTool === 'circle' && !!circleStart)
    .onUpdate((e) => {
      if (circleStart) {
        const r = Math.sqrt(e.translationX ** 2 + e.translationY ** 2) / frameWidth;
        circleRadiusRef.current = r;
        setCircleRadius(r);
      }
    })
    .onEnd(() => {
      const r = circleRadiusRef.current;
      if (circleStart && r > 0.01) {
        onPlaceCircle(circleStart.x, circleStart.y, r);
      }
      setCircleStart(null);
      setCircleRadius(0);
    });

  const handleTextSubmit = () => {
    if (textModal && textValue.trim()) {
      onPlaceText(textModal.x, textModal.y, textValue.trim());
      setTextModal(null);
      setTextValue('');
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[StyleSheet.absoluteFill, { width: frameWidth, height: frameHeight }]}>
        {annotations.map((a) => {
          if (a.type === 'text') {
            const p = a.payload as { x: number; y: number; text: string };
            return (
              <View
                key={a.id}
                style={[
                  styles.textLabel,
                  {
                    left: p.x * frameWidth - 40,
                    top: p.y * frameHeight - 12,
                  },
                ]}
              >
                <Text style={styles.textLabelText} numberOfLines={2}>
                  {p.text}
                </Text>
              </View>
            );
          }
          if (a.type === 'arrow') {
            const p = a.payload as { x1: number; y1: number; x2: number; y2: number };
            const dx = (p.x2 - p.x1) * frameWidth;
            const dy = (p.y2 - p.y1) * frameHeight;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const angle = Math.atan2(dy, dx);
            return (
              <View
                key={a.id}
                style={[
                  styles.arrowLine,
                  {
                    left: p.x1 * frameWidth,
                    top: p.y1 * frameHeight,
                    width: len,
                    transform: [{ rotate: `${angle}rad` }],
                  },
                ]}
              />
            );
          }
          if (a.type === 'circle') {
            const p = a.payload as unknown as { x: number; y: number; r: number };
            const r = p.r * frameWidth;
            return (
              <View
                key={a.id}
                style={[
                  styles.circle,
                  {
                    left: p.x * frameWidth - r,
                    top: p.y * frameHeight - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: r,
                  },
                ]}
              />
            );
          }
          return null;
        })}

        {arrowStart && (
          <View
            style={[
              styles.arrowDot,
              {
                left: arrowStart.x * frameWidth - 6,
                top: arrowStart.y * frameHeight - 6,
              },
            ]}
          />
        )}

        {circleStart && (
          <View
            style={[
              styles.circlePreview,
              {
                left: circleStart.x * frameWidth - circleRadius * frameWidth,
                top: circleStart.y * frameHeight - circleRadius * frameWidth,
                width: circleRadius * frameWidth * 2,
                height: circleRadius * frameWidth * 2,
                borderRadius: circleRadius * frameWidth,
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          activeOpacity={1}
        />

        <Modal
          visible={!!textModal}
          transparent
          animationType="fade"
          onRequestClose={() => setTextModal(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setTextModal(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <TextInput
                style={styles.textInput}
                placeholder="Annotation text"
                placeholderTextColor="#888"
                value={textValue}
                onChangeText={setTextValue}
                autoFocus
                onSubmitEditing={handleTextSubmit}
              />
              <TouchableOpacity style={styles.modalBtn} onPress={handleTextSubmit}>
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  textLabel: {
    position: 'absolute',
    maxWidth: 120,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
  },
  textLabelText: {
    color: '#fff',
    fontSize: 12,
  },
  arrowLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#b8860b',
  },
  arrowDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b8860b',
  },
  circle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#b8860b',
    backgroundColor: 'transparent',
  },
  circlePreview: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#b8860b',
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    width: Math.min(SCREEN_WIDTH - 48, 280),
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  modalBtn: {
    backgroundColor: '#b8860b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
