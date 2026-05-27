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
          Animated.timing(borderOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(borderOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      borderOpacity.setValue(1);
    }

    if (state === 'correct') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -4, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const bg = {
    inactive: '#ECEFF1',
    active: '#FFFFFF',
    correct: '#66BB6A',
    wrong: '#FFEBEE',
    revealed: '#F5F5F5',
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
        ]}
      >
        {showBorder && state === 'active' && (
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pulseBorder: {
    borderRadius: 12,
    borderWidth: 2,
  },
  text: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
});
