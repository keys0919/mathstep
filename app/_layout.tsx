import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useConfigStore } from '../src/stores/config.store';
import { useProgressStore } from '../src/stores/progress.store';

export default function RootLayout() {
  const loadConfig = useConfigStore((s) => s.load);
  const loadProgress = useProgressStore((s) => s.load);

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.ttf'),
  });

  useEffect(() => {
    loadConfig();
    loadProgress();
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/mathstep/sw.js').catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <Head>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#F9FBE7" />
      </Head>
      <StatusBar style="dark" backgroundColor="#F9FBE7" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FBE7' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="garden" />
        <Stack.Screen name="(session)" />
      </Stack>
    </SafeAreaProvider>
  );
}
