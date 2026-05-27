import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Pressable } from 'react-native';

export type MathBoxState = 'inactive' | 'active' | 'correct' | 'wrong' | 'revealed';

interface Props {
  value?: number | string;
  state: MathBoxState;
  onPress?: () => void;
  width?: number;
}

export default function MathBox({ value, state, onPress, width = 52 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'active') {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(borderOpacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
          Animated.timing(borderOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      borderOpacity.setValue(1);
    }

    if (state === 'correct') {
      // spring pop: 빠르게 튀어오르고 자연스럽게 안착
      Animated.spring(scale, {
        toValue: 1.18,
        useNativeDriver: true,
        friction: 4,
        tension: 250,
      }).start(() => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 120,
        }).start();
      });
    }

    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -7, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 7, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -5, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 5, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -3, duration: 45, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    }

    if (state === 'inactive' || state === 'revealed') {
      scale.setValue(1);
      translateX.setValue(0);
    }
  }, [state]);

  const bg = {
    inactive: '#ECEFF1',
    active: '#FFFFFF',
    correct: '#66BB6A',
    wrong: '#FFEBEE',
    revealed: '#F0F4E8',
  }[state];

  const textColor = {
    inactive: '#B0BEC5',
    active: '#2E3A23',
    correct: '#FFFFFF',
    wrong: '#EF5350',
    revealed: '#6A7B5A',
  }[state];

  const showBorder = state === 'active' || state === 'wrong';
  const borderColor = state === 'wrong' ? '#EF5350' : '#4CAF50';

  return (
    <Animated.View style={{ transform: [{ scale }, { translateX }] }}>
      <Pressable
        onPress={state === 'active' ? onPress : undefined}
        style={[
          styles.box,
          { width, backgroundColor: bg },
          showBorder && { borderWidth: 2, borderColor },
          state === 'correct' && styles.correctShadow,
          state === 'active' && styles.activeShadow,
        ]}
      >
        {state === 'active' && (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.pulseBorder, { opacity: borderOpacity, borderColor }]}
          />
        )}
        <Text style={[styles.text, { color: textColor }]}>
          {value !== undefined ? String(value) : (state === 'active' ? '?' : '')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 52,
    minWidth: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeShadow: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  correctShadow: {
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pulseBorder: {
    borderRadius: 14,
    borderWidth: 2,
  },
  text: {
    fontSize: 32,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
});
