import React, { useMemo, useState, useRef } from 'react';
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
import Svg, { Circle as SvgCircle, Line as SvgLine, Polygon as SvgPolygon } from 'react-native-svg';
import type { ClipAnnotation, AnnotationType, CirclePayload } from '@roam/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type VideoContentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface AnnotationOverlayProps {
  annotations: ClipAnnotation[];
  containerWidth: number;
  containerHeight: number;
  videoRect: VideoContentRect;
  activeTool: AnnotationType;
  onPlaceText: (x: number, y: number, text: string) => void;
  onPlaceArrow: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceCircle: (cx: number, cy: number, r: number) => void;
}

export function AnnotationOverlay({
  annotations,
  containerWidth,
  containerHeight,
  videoRect,
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
    if (videoRect.width <= 0 || videoRect.height <= 0) return;
    const x = e.nativeEvent.locationX / videoRect.width;
    const y = e.nativeEvent.locationY / videoRect.height;
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
        const denom = videoRect.width || 1;
        const r = Math.sqrt(e.translationX ** 2 + e.translationY ** 2) / denom;
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

  const arrowSvgShapes = useMemo(() => {
    const stroke = '#b8860b';
    const strokeWidth = 2;
    const headLen = 14;
    const headWidth = 9;

    const shapes: Array<
      | { kind: 'line'; key: string; x1: number; y1: number; x2: number; y2: number }
      | { kind: 'head'; key: string; points: string }
    > = [];

    for (const a of annotations) {
      if (a.type !== 'arrow') continue;
      const p = a.payload as { x1: number; y1: number; x2: number; y2: number };
      const x1 = p.x1 * videoRect.width;
      const y1 = p.y1 * videoRect.height;
      const x2 = p.x2 * videoRect.width;
      const y2 = p.y2 * videoRect.height;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (!len || len < 2) continue;

      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;

      const tipX = x2;
      const tipY = y2;
      const baseX = tipX - ux * headLen;
      const baseY = tipY - uy * headLen;
      const leftX = baseX + px * headWidth;
      const leftY = baseY + py * headWidth;
      const rightX = baseX - px * headWidth;
      const rightY = baseY - py * headWidth;

      shapes.push({ kind: 'line', key: `${a.id}-line`, x1, y1, x2, y2 });
      shapes.push({
        kind: 'head',
        key: `${a.id}-head`,
        points: `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`,
      });
    }

    return { shapes, stroke, strokeWidth };
  }, [annotations, videoRect.width, videoRect.height]);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[StyleSheet.absoluteFill, { width: containerWidth, height: containerHeight }]}>
        <View
          style={[
            styles.videoContentLayer,
            { left: videoRect.x, top: videoRect.y, width: videoRect.width, height: videoRect.height },
          ]}
        >
          <Svg
            width={videoRect.width}
            height={videoRect.height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {arrowSvgShapes.shapes.map((s) => {
              if (s.kind === 'line') {
                return (
                  <SvgLine
                    key={s.key}
                    x1={s.x1}
                    y1={s.y1}
                    x2={s.x2}
                    y2={s.y2}
                    stroke={arrowSvgShapes.stroke}
                    strokeWidth={arrowSvgShapes.strokeWidth}
                  />
                );
              }
              return (
                <SvgPolygon key={s.key} points={s.points} fill={arrowSvgShapes.stroke} />
              );
            })}

            {annotations
              .filter((a) => a.type === 'circle')
              .map((a) => {
                const p = a.payload as unknown as CirclePayload;
                const cx = p.cx * videoRect.width;
                const cy = p.cy * videoRect.height;
                const r = p.r * videoRect.width;
                return (
                  <SvgCircle
                    key={a.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    stroke="#b8860b"
                    strokeWidth={2}
                    fill="transparent"
                  />
                );
              })}

            {circleStart && circleRadius > 0 ? (
              <SvgCircle
                cx={circleStart.x * videoRect.width}
                cy={circleStart.y * videoRect.height}
                r={circleRadius * videoRect.width}
                stroke="#b8860b"
                strokeWidth={2}
                fill="transparent"
                strokeDasharray="6 6"
              />
            ) : null}
          </Svg>

          {annotations
            .filter((a) => a.type === 'text')
            .map((a) => {
              const p = a.payload as { x: number; y: number; text: string };
              return (
                <View
                  key={a.id}
                  style={[
                    styles.textLabel,
                    {
                      left: p.x * videoRect.width - 40,
                      top: p.y * videoRect.height - 12,
                    },
                  ]}
                >
                  <Text style={styles.textLabelText} numberOfLines={2}>
                    {p.text}
                  </Text>
                </View>
              );
            })}

          {arrowStart && (
            <View
              style={[
                styles.arrowDot,
                {
                  left: arrowStart.x * videoRect.width - 6,
                  top: arrowStart.y * videoRect.height - 6,
                },
              ]}
            />
          )}

          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handlePress} activeOpacity={1} />
        </View>

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
  videoContentLayer: {
    position: 'absolute',
  },
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
  arrowDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b8860b',
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
