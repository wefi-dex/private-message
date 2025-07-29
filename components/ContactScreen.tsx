import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, Keyboard, Modal, Image, FlatList, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUsers, createUserConnection, getUserConnectionStatus, getUserByUsername, getPendingConnectionRequests, respondToConnectionRequest, getConnectionHistory } from '@/utils/api';
import { useAuth } from '@/components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { db } from '@/constants/firebase';
import { onValue, off, ref } from 'firebase/database';

// Component for managing connection requests (for creators)
function ConnectionRequestsManager() {
  const { token, user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newRequestCount, setNewRequestCount] = useState(0);

  const loadData = async () => {
    if (!user?.id || !token) return;
    
    try {
      setLoading(true);
      const [pending, history] = await Promise.all([
        getPendingConnectionRequests(user.id, token),
        getConnectionHistory(user.id, token)
      ]);
      setPendingRequests(pending);
      setConnectionHistory(history);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id, token]);

  // Real-time listener for new connection requests
  useEffect(() => {
    if (!user?.id) return;
    
    const connectionRequestsRef = ref(db, `connectionRequests/${user.id}`);
    const handle = onValue(connectionRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // When a new request comes in, refresh the data
        loadData();
        
        // Show notification for new requests
        if (data.timestamp && !data.action) {
          setNewRequestCount(prev => prev + 1);
          // Reset count after 3 seconds
          setTimeout(() => setNewRequestCount(0), 3000);
        }
      }
    });
    
    return () => off(connectionRequestsRef, 'value', handle);
  }, [user?.id]);

  // Reload data when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !token) return;
      loadData();
    }, [user?.id, token])
  );

  const handleRespondToRequest = async (connectionId: string, action: 'accept' | 'reject') => {
    if (!token) return;
    
    try {
      await respondToConnectionRequest(connectionId, action, token);
      // Remove the request from pending and add to history
      const requestToMove = pendingRequests.find(req => req.id === connectionId);
      if (requestToMove) {
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        setConnectionHistory(prev => [{
          ...requestToMove,
          status: action === 'accept' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        }, ...prev]);
      }
      alert(`Request ${action}ed successfully!`);
    } catch (error: any) {
      alert(error.message || `Failed to ${action} request`);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
        <Image
          source={item.avatar ? { uri: item.avatar } : require('@/assets/images/default-contact-2.png')}
          style={styles.requestAvatar}
        />
        <View style={styles.requestInfo}>
          <ThemedText style={styles.requestName}>{item.alias || item.username}</ThemedText>
          <ThemedText style={styles.requestUsername}>@{item.username}</ThemedText>
          {item.bio && (
            <ThemedText style={styles.requestBio} numberOfLines={2}>
              {item.bio}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleRespondToRequest(item.id, 'accept')}
        >
          <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRespondToRequest(item.id, 'reject')}
        >
          <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={[styles.requestItem, styles.historyItem]}>
      <View style={styles.requestHeader}>
        <Image
          source={item.avatar ? { uri: item.avatar } : require('@/assets/images/default-contact-2.png')}
          style={styles.requestAvatar}
        />
        <View style={styles.requestInfo}>
          <ThemedText style={styles.requestName}>{item.alias || item.username}</ThemedText>
          <ThemedText style={styles.requestUsername}>@{item.username}</ThemedText>
          {item.bio && (
            <ThemedText style={styles.requestBio} numberOfLines={2}>
              {item.bio}
            </ThemedText>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'accepted' ? styles.acceptedBadge : styles.rejectedBadge
        ]}>
          <ThemedText style={styles.statusText}>
            {item.status === 'accepted' ? 'Accepted' : 'Rejected'}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <ThemedView style={{ flex: 1, padding: 24, paddingTop: 48 }}>
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={{ marginBottom: 24, textAlign: 'center' }}>
          Connection Requests
        </ThemedText>
        {newRequestCount > 0 && (
          <View style={styles.notificationBadge}>
            <ThemedText style={styles.notificationText}>
              {newRequestCount} new request{newRequestCount !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}
      </View>
      
      <FlatList
        data={[
          ...(pendingRequests.length > 0 ? [
            { type: 'section', title: 'New Requests', count: pendingRequests.length },
            ...pendingRequests.map(item => ({ ...item, section: 'pending' }))
          ] : []),
          ...(connectionHistory.length > 0 ? [
            { type: 'section', title: 'History' },
            ...connectionHistory.map(item => ({ ...item, section: 'history' }))
          ] : [])
        ]}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>{item.title}</ThemedText>
                {item.title === 'New Requests' && (
                  <ThemedText style={styles.sectionSubtitle}>
                    {item.count} pending request{item.count !== 1 ? 's' : ''}
                  </ThemedText>
                )}
              </View>
            );
          }
          return item.section === 'pending' 
            ? renderRequestItem({ item }) 
            : renderHistoryItem({ item });
        }}
        keyExtractor={(item, index) => item.type === 'section' ? `${item.title}-${index}` : item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={64} color="#666" />
            <ThemedText style={styles.emptyStateText}>
              No connection requests
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              When fans send you connection requests, they&apos;ll appear here
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

// Original component for finding creators (for fans)
function FindCreatorScreen() {
  const { token, user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Real-time listener for connection request updates
  useEffect(() => {
    if (!user?.id) return;
    
    const connectionRequestsRef = ref(db, `connectionRequests/${user.id}`);
    const handle = onValue(connectionRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.action) {
        // If there's an action (accept/reject), update the search result
        if (searchResult && searchResult.id === data.to) {
          setSearchResult((prev: any) => ({
            ...prev,
            connectionStatus: data.action === 'accept' ? 'accepted' : 'rejected'
          }));
        }
      }
    });
    
    return () => off(connectionRequestsRef, 'value', handle);
  }, [user?.id, searchResult]);

  // Reload data when tab is focused
  useFocusEffect(
    useCallback(() => {
      // Clear any existing search results when tab is focused
      setSearchResult(null);
      setError('');
      setInviteCode('');
    }, [])
  );

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
      // Immediately update UI to show 'Requested' for better UX
      setSearchResult((prev: any) => prev ? { ...prev, connectionStatus: 'pending', connectionUserId: user.id } : prev);
      
      await createUserConnection(user.id, searchResult.id, token);
      alert('Connection request sent!');
    } catch (e: any) {
      // Revert the UI change if the request failed
      setSearchResult((prev: any) => prev ? { ...prev, connectionStatus: null, connectionUserId: null } : prev);
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

function ContactScreen() {
  const { user } = useAuth();
  
  // Show different content based on user role
  if (user?.role === 'creator') {
    return <ConnectionRequestsManager />;
  } else {
    return <FindCreatorScreen />;
  }
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
  requestItem: {
    backgroundColor: 'rgba(20,20,30,0.7)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  requestUsername: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  requestBio: {
    fontSize: 14,
    color: '#f6f6ff',
    opacity: 0.9,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  historyItem: {
    opacity: 0.8,
    backgroundColor: 'rgba(20,20,30,0.5)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  acceptedBadge: {
    backgroundColor: '#4CAF50',
  },
  rejectedBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#F357A8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 