import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

interface Props {
  count: number;
  triggerAt?: number;
}

export default function SeedCounter({ count, triggerAt }: Props) {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      floatY.setValue(0);
      floatOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(floatY, { toValue: -40, duration: 500, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(floatOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    }
    prevCount.current = count;
  }, [count]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.floating, { transform: [{ translateY: floatY }], opacity: floatOpacity }]}
      >
        🌱+1
      </Animated.Text>
      <Text style={styles.seed}>🌱</Text>
      <Text style={styles.count}>× {count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  floating: {
    position: 'absolute',
    top: -8,
    left: 0,
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#4CAF50',
  },
  seed: {
    fontSize: 20,
  },
  count: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
});
