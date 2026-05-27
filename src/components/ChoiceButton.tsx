import { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

type ButtonState = 'default' | 'correct' | 'wrong' | 'disabled';

interface Props {
  label: string | number;
  state?: ButtonState;
  onPress?: () => void;
}

export default function ChoiceButton({ label, state = 'default', onPress }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (state !== 'default') return;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 3, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 6, tension: 200 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }),
    ]).start();
  };

  const bg = {
    default: '#FFFFFF',
    correct: '#4CAF50',
    wrong: '#EF5350',
    disabled: '#F5F5F5',
  }[state];

  const textColor = {
    default: '#2E3A23',
    correct: '#FFFFFF',
    wrong: '#FFFFFF',
    disabled: '#B0BEC5',
  }[state];

  const bottomBorderColor = {
    default: '#C8CDD4',
    correct: '#388E3C',
    wrong: '#C62828',
    disabled: '#E0E0E0',
  }[state];

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
      <Pressable
        onPress={state === 'default' ? onPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          { backgroundColor: bg, borderBottomColor: bottomBorderColor },
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{String(label)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 104,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
});
