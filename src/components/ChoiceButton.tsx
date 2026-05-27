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

  const handlePressIn = () => {
    if (state !== 'default') return;
    Animated.timing(translateY, { toValue: 2, duration: 80, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }).start();
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
    default: '#D1D5DB',
    correct: '#388E3C',
    wrong: '#C62828',
    disabled: '#E0E0E0',
  }[state];

  const isPressed = state === 'default';

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
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
    minWidth: 100,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 22,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
});
