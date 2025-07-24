import { AuthProvider } from '@/components/AuthContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Sora': require('@/assets/fonts/Sora-Regular.ttf'),
    'Sora-Bold': require('@/assets/fonts/Sora-Bold.ttf'),
    'Sora-SemiBold': require('@/assets/fonts/Sora-SemiBold.ttf'),
    'Sora-Medium': require('@/assets/fonts/Sora-Medium.ttf'),
    'Sora-Light': require('@/assets/fonts/Sora-Light.ttf'),
    'Sora-ExtraBold': require('@/assets/fonts/Sora-ExtraBold.ttf'),
    'Sora-ExtraLight': require('@/assets/fonts/Sora-ExtraLight.ttf'),
  });

  // Force dark theme as default
  const colorScheme = useColorScheme() || 'dark';

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme}>
        <Slot />
      </ThemeProvider>
    </AuthProvider>
  );
} 