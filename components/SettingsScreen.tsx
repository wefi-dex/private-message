import { useThemeContext } from '@/components/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Switch } from 'react-native';

function SettingsScreen() {
  const { theme, setTheme } = useThemeContext();
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Settings Page</ThemedText>
      <ThemedText style={{ marginTop: 24, marginBottom: 8 }}>Dark Mode</ThemedText>
      <Switch value={isDark} onValueChange={toggleTheme} />
    </ThemedView>
  );
}

function SettingsDetailScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Settings Detail</ThemedText>
    </ThemedView>
  );
}

const SettingsStack = createStackNavigator();

function SettingsScreenWithTabBarHidden(props: any) {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
  return <SettingsDetailScreen {...props} />;
}

export default function SettingsStackScreen() {
  const { theme, setTheme } = useThemeContext();
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="SettingsDetail" component={SettingsScreenWithTabBarHidden} />
    </SettingsStack.Navigator>
  );
} 