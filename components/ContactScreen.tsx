import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, Keyboard, Modal, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUsers, createUserConnection, getUserConnectionStatus, getUserByUsername } from '@/utils/api';
import { useAuth } from '@/components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

function ContactScreen() {
  const { token, user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Handle QR scan result
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    setInviteCode(data);
    handleSearch(data);
  };

  // Request camera permission for QR scan
  const requestPermission = async () => {
    //   const { status } = await BarCodeScanner.requestPermissionsAsync();
    //   setHasPermission(status === 'granted');
    //   if (status === 'granted') setScanning(true);
  };

  // Search for creator by invite code (username or URL)
  const handleSearch = async (code?: string) => {
    setError('');
    setSearchResult(null);
    let search = (code || inviteCode).trim();
    if (!search) {
      setError('Please enter an invite code.');
      return;
    }
    // Extract username from URL if present
    const urlMatch = search.match(/https?:\/\/pm\.me\/invite\/([a-zA-Z0-9_\-]+)/);
    if (urlMatch && urlMatch[1]) {
      search = urlMatch[1];
    }
    try {
      const found = await getUserByUsername(search, user?.id, token || undefined);
      setSearchResult(found);
    } catch (e: any) {
      setError(e.message || 'Failed to search for creator.');
    }
  };

  // Handle connect button
  const handleConnect = async () => {
    if (!user || !token || !searchResult) {
      alert('You must be logged in to connect.');
      return;
    }
    try {
      await createUserConnection(user.id, searchResult.id, token);
      // Immediately update UI to show 'Requested'
      setSearchResult((prev: any) => prev ? { ...prev, connectionStatus: 'pending', connectionUserId: user.id } : prev);
      alert('Connection request sent!');
    } catch (e: any) {
      alert(e.message || 'Failed to send connection request.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', padding: 24, paddingTop: 48 }}>
      <ThemedText type="title" style={{ marginBottom: 16 }}>Find Creator</ThemedText>
      <View style={styles.inputRow}>
        <TextInput
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="Enter invite code (username)"
          style={styles.input}
          autoCapitalize="none"
          placeholderTextColor="#aaa"
          onSubmitEditing={() => { Keyboard.dismiss(); handleSearch(); }}
        />
        <TouchableOpacity onPress={() => handleSearch()} style={styles.searchBtn}>
          <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Search</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={requestPermission} style={styles.qrBtn}>
          <Feather name="camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {error ? <ThemedText style={{ color: 'red', marginTop: 8 }}>{error}</ThemedText> : null}
      {searchResult && (
        <View style={{ marginTop: 40, width: '100%', alignItems: 'center' }}>
          <BlurView intensity={70} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', width: '100%', borderWidth: 2, borderColor: '#A259FF', shadowColor: '#A259FF', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12, backgroundColor: 'rgba(20,20,30,0.7)' }}>
            <View style={{ backgroundColor: 'rgba(20,20,30,0.72)', padding: 36, borderRadius: 28, alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginBottom: 22 }}>
                <View style={{ width: 108, height: 108, borderRadius: 54, overflow: 'hidden', backgroundColor: '#232345', marginBottom: 18, borderWidth: 2, borderColor: '#A259FF', shadowColor: '#A259FF', shadowOpacity: 0.35, shadowRadius: 12 }}>
                  <Image
                    source={searchResult.avatar ? { uri: searchResult.avatar } : require('@/assets/images/default-contact-2.png')}
                    style={{ width: 108, height: 108, borderRadius: 54 }}
                    resizeMode="cover"
                  />
                </View>
                <ThemedText type="title" style={{ fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 12, letterSpacing: 0.5, textShadowColor: '#A259FF', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>{searchResult.alias || 'No alias'}</ThemedText>
                <ThemedText style={{ color: '#f6f6ff', fontSize: 17, textAlign: 'center', lineHeight: 26, marginTop: 6, maxWidth: 300, opacity: 0.98 }}>
                  {searchResult.bio && searchResult.bio.trim()
                    ? searchResult.bio.length > 80
                      ? searchResult.bio.slice(0, 80) + '...'
                      : searchResult.bio
                    : 'No bio'}
                </ThemedText>
                <TouchableOpacity
                  style={{ marginTop: 18, backgroundColor: '#A259FF', borderRadius: 22, paddingHorizontal: 36, paddingVertical: 12, alignItems: 'center', shadowColor: '#A259FF', shadowOpacity: 0.18, shadowRadius: 8, opacity: searchResult.connectionStatus === 'pending' ? 0.6 : 1 }}
                  onPress={handleConnect}
                  disabled={searchResult.connectionStatus === 'pending'}
                >
                  <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {searchResult.connectionStatus === 'pending' ? 'Requested' : 'Connect'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      )}
      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          {/* <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={{ width: '100%', height: '80%' }}
          /> */}
          <TouchableOpacity onPress={() => setScanning(false)} style={styles.closeBtn}>
            <ThemedText style={{ color: '#fff', fontSize: 18 }}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </Modal>
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

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  input: { flex: 1, fontSize: 18, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff', color: '#222' },
  searchBtn: { marginLeft: 8, backgroundColor: '#6B47DC', borderRadius: 8, padding: 8 },
  qrBtn: { marginLeft: 8, backgroundColor: '#A259FF', borderRadius: 8, padding: 8 },
  resultBox: { marginTop: 24, padding: 18, backgroundColor: '#f6f6ff', borderRadius: 12, alignItems: 'center', width: '100%' },
  closeBtn: { marginTop: 24, backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
}); 