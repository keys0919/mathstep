import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
  combo: number;
  threshold: number;
}

export default function ComboDisplay({ combo, threshold }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const visible = combo >= threshold;

  useEffect(() => {
    if (combo === threshold) {
      // 등장: 위에서 떨어지며 spring 바운스
      translateY.setValue(-12);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 200,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 180,
        }),
      ]).start();
    } else if (combo > threshold) {
      // 숫자 증가 시 작은 펄스
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, friction: 4, tension: 300 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 150 }),
      ]).start();
    } else if (combo === 0) {
      scale.setValue(0);
      translateY.setValue(-12);
    }
  }, [combo]);

  if (!visible) return null;

  const intensity = Math.min((combo - threshold) / 10, 1);
  const r = Math.round(255);
  const g = Math.round(112 - intensity * 70);
  const b = Math.round(67 - intensity * 50);
  const bg = `rgb(${r}, ${g}, ${b})`;
  const border = `rgb(${Math.round(r * 0.78)}, ${Math.round(g * 0.78)}, ${Math.round(b * 0.78)})`;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderBottomColor: border,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <Text style={styles.text}>🔥 {combo} COMBO</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderBottomWidth: 3,
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
