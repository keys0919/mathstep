import { Tabs } from 'expo-router';
import { View, Text, Image, ImageSourcePropType, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICONS = {
  home:   require('../../assets/icons/home.png'),
  garden: require('../../assets/nature/sprout_b.png'),
  list:   require('../../assets/icons/list.png'),
};

function TabIcon({
  icon, label, focused,
}: {
  icon: ImageSourcePropType; label: string; focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconBubble, focused && styles.iconBubbleFocused]}>
        <Image
          source={icon}
          style={[styles.iconImg, { tintColor: focused ? '#4CAF50' : '#9E9E9E' }]}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.iconLabel, focused && styles.iconLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEF2E6',
          height: 64 + (Platform.OS === 'ios' ? insets.bottom : 12),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.home} label="홈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.garden} label="정원" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ICONS.list} label="기록" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 3,
  },
  iconBubble: {
    width: 40,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBubbleFocused: {
    backgroundColor: '#E8F5E9',
  },
  iconImg: {
    width: 22,
    height: 22,
  },
  iconLabel: {
    fontSize: 10,
    fontFamily: 'Pretendard-Medium',
    color: '#9E9E9E',
  },
  iconLabelFocused: {
    color: '#4CAF50',
    fontFamily: 'Pretendard-SemiBold',
  },
});
