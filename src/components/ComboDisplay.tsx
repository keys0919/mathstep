import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  combo: number;
  threshold: number;  // 희귀 씨앗 임계값 (comboThreshold2)
}

export default function ComboDisplay({ combo, threshold }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  const isAchieved = combo >= threshold;
  const isBuilding = combo > 0 && !isAchieved;

  // 프로그레스바 애니메이션
  useEffect(() => {
    if (isBuilding) {
      Animated.spring(barWidth, {
        toValue: combo / threshold,
        useNativeDriver: false,
        friction: 8,
        tension: 120,
      }).start();
    }
  }, [combo, threshold]);

  // 달성 배지 애니메이션
  useEffect(() => {
    if (combo === threshold) {
      translateY.setValue(-12);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 6, tension: 180 }),
      ]).start();
    } else if (combo > threshold) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, friction: 4, tension: 300 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 150 }),
      ]).start();
    } else if (combo === 0) {
      scale.setValue(0);
      barWidth.setValue(0);
      translateY.setValue(-12);
    }
  }, [combo]);

  if (combo === 0) return null;

  // 달성 이후: 기존 배지
  if (isAchieved) {
    const intensity = Math.min((combo - threshold) / 10, 1);
    const g = Math.round(112 - intensity * 70);
    const b = Math.round(67 - intensity * 50);
    const bg = `rgb(255, ${g}, ${b})`;
    const border = `rgb(${Math.round(255 * 0.78)}, ${Math.round(g * 0.78)}, ${Math.round(b * 0.78)})`;

    return (
      <Animated.View
        style={[
          styles.badge,
          { backgroundColor: bg, borderBottomColor: border, transform: [{ scale }, { translateY }] },
        ]}
      >
        <Text style={styles.badgeText}>🔥 {combo} COMBO</Text>
      </Animated.View>
    );
  }

  // 달성 전: 프로그레스바
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressCombo}>🔥 {combo}</Text>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={styles.progressGoal}>🌺 -{threshold - combo}</Text>
    </View>
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
  badgeText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressCombo: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#FF7043',
    minWidth: 28,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#FFE0B2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF7043',
    borderRadius: 3,
  },
  progressGoal: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#FF80AB',
    minWidth: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
