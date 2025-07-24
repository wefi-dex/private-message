import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

function ContactScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Contact Page</ThemedText>
    </ThemedView>
  );
}

function ContactDetailScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Contact Detail</ThemedText>
    </ThemedView>
  );
}

const ContactStack = createStackNavigator();

function ContactScreenWithTabBarHidden(props: any) {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
  return <ContactDetailScreen {...props} />;
}

export default function ContactStackScreen() {
  return (
    <ContactStack.Navigator screenOptions={{ headerShown: false }}>
      <ContactStack.Screen name="ContactMain" component={ContactScreen} />
      <ContactStack.Screen name="ContactDetail" component={ContactScreenWithTabBarHidden} />
    </ContactStack.Navigator>
  );
} 