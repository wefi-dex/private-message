import { useAuth } from '@/components/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import ChatsStackScreen from '@/components/ChatsStackScreen';
import ContactStackScreen from '@/components/ContactScreen';
import ProfileStackScreen from '@/components/ProfileScreen';
import SettingsStackScreen from '@/components/SettingsScreen';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5, Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { Animated } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';

// Add QRCode import (mock with a View if not installed)
let QRCode: any = undefined;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch { }

// Define types for navigation
const Tab = createBottomTabNavigator();

export default function App() {
  // Always call hooks at the top, before any conditional returns
  const { user, logout } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const splashOpacity = React.useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme() ?? 'light';

  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);


  // Use theme colors for the tab bar and header
  const tabBarActiveTintColor = colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary;
  const tabBarInactiveTintColor = colorScheme === 'dark' ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault;
  const tabBarStyle = {
    backgroundColor: '#1C1B2D',
    height: 54,
    borderTopWidth: 1,
    borderColor: '#22202B',
    // Ensure consistent styling regardless of navigation state
    position: 'relative' as const,
  };
  const headerStyle = {
    backgroundColor: colorScheme === 'light'
      ? Colors.light.primary
      : Colors.dark.primary,

  };
  const headerTintColor = 'white';
  const headerTitleStyle = {
    fontFamily: 'Sora-Bold',
  };

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation, theme }) => ({
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        headerStyle,
        headerTintColor,
        headerTitleStyle,
        tabBarLabel: () => null, // Remove label text
        tabBarShowLabel: false, // Remove label text
        tabBarIcon: ({ color, focused }) => {
          const iconColor = 'white';
          if (route.name === 'Chats') {
            return <Ionicons name="chatbubble-outline" size={16} color={iconColor} />;
          }
          if (route.name === 'Phone') {
            return <FontAwesome5 name="user-circle" size={16} color={iconColor} />;

          }
          if (route.name === 'Contact') {
            // return <SimpleLineIcons name="phone" size={16} color={iconColor} />;
            return <AntDesign name="swap" size={16} color={iconColor} />
          }
          if (route.name === 'Settings') {
            return <AntDesign name="setting" size={16} color={iconColor} />;
          }
          return null;
        },
        tabBarItemStyle: {
          marginVertical: 6,
        },
        tabBarStyle,
      })}
    >
      <Tab.Screen name="Chats" component={ChatsStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Phone" component={ProfileStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Contact" component={ContactStackScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsStackScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
