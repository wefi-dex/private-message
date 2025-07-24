import ChatRoomScreen from '@/components/ChatRoomScreen';
import ChatsListScreen from '@/components/ChatsListScreen';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

const ChatStack = createStackNavigator();

export default function ChatsStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatsList" component={ChatsListScreen} />
      <ChatStack.Screen name="ChatRoom" component={ChatRoomScreenWithTabBarHidden} />
    </ChatStack.Navigator>
  );
}

function ChatRoomScreenWithTabBarHidden(props: any) {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      // Restore the custom tab bar style instead of undefined
      navigation.getParent()?.setOptions({ 
        tabBarStyle: {
          backgroundColor: '#1C1B2D',
          height: 54,
          borderTopWidth: 1,
          borderColor: '#22202B',
          position: 'relative' as const,
        }
      });
    };
  }, [navigation]);
  return <ChatRoomScreen {...props} />;
} 