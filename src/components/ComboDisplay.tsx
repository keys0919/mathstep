import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
  combo: number;
  threshold: number;
}

export default function ComboDisplay({ combo, threshold }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const visible = combo >= threshold;

  useEffect(() => {
    if (combo === threshold) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.0, useNativeDriver: true }),
      ]).start();
    } else if (combo === 0) {
      scale.setValue(0);
    }
  }, [combo]);

  if (!visible) return null;

  const intensity = Math.min((combo - threshold) / 10, 1);
  const bg = `rgba(255, ${Math.round(112 - intensity * 60)}, ${Math.round(67 - intensity * 40)}, 1)`;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: bg, transform: [{ scale }] }]}>
      <Text style={styles.text}>🔥 {combo} COMBO</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
});
