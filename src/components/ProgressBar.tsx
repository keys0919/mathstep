import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

interface Props {
  current: number;
  total: number;
  label?: string;
  color?: string;
}

export default function ProgressBar({ current, total, label, color = '#4CAF50' }: Props) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  const widthAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
    minWidth: 36,
    textAlign: 'right',
  },
});
