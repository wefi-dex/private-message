import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/constants/firebase';
import { formatMessageTime, getChatId } from '@/utils/chatUtils';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { limitToLast, off, onValue, orderByChild, query, ref, serverTimestamp, set, onDisconnect } from 'firebase/database';
import React, { useState, useEffect, memo, useCallback } from 'react';
import { Dimensions, FlatList, Image, Pressable, TextInput, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getConnectedUsers } from '@/utils/api';
import BlockReportModal from './BlockReportModal';

const defaultProfileImage = require('@/assets/images/default-contact-2.png');

// --- Components ---

const ChatListItem = memo(function ChatListItem({ item, lastMsg, onPress, userStatus, unreadCount, onBlockReport }: any) {
  const displayName = item.displayName;
  const lastMessageTime = lastMsg ? formatMessageTime(lastMsg.timestamp) : '';
  const isOnline = userStatus?.state === 'online';
  
  const handleLongPress = () => {
    onBlockReport?.(item);
  };
  
  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.chatItem,
        pressed && styles.chatItemPressed,
      ]}
    >
      <View style={styles.avatarOuter}>
        <View style={styles.avatarMiddle}>
          <View style={styles.avatarInner}>
            <Image
              source={item.avatar ? { uri: item.avatar } : defaultProfileImage}
              style={styles.avatarImg}
            />
          </View>
        </View>
        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
      </View>
      <View style={styles.chatContent}>
        <ThemedText type="title" style={[styles.chatName, unreadCount > 0 && styles.unreadChatName]}>{displayName}</ThemedText>
        <ThemedText style={[styles.chatMsg, unreadCount > 0 && styles.unreadChatMsg]}>
          {lastMsg ? (lastMsg.from === item.id ? `You: ${lastMsg.text}` : lastMsg.text) : ''}
        </ThemedText>
      </View>
      <View style={styles.chatMeta}>
        <ThemedText style={[styles.chatTime, unreadCount > 0 && styles.unreadChatTime]}>{lastMessageTime}</ThemedText>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <ThemedText style={styles.unreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
});
ChatListItem.displayName = 'ChatListItem';

const StoriesRow = memo(function StoriesRow({ user, chats, navigation, userStatuses }: any) {
  return (
    <View style={styles.storiesRow}>
      <FlatList
        data={[{ id: 'my', displayName: 'My status', isMe: true, avatar: user?.avatar }, ...chats.slice(0, 8)]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.storiesList}
        renderItem={({ item }) => {
          const isOnline = item.id !== 'my' && userStatuses[item.id]?.state === 'online';
          return (
            <View style={styles.storyItem}>
              <TouchableOpacity
                onPress={() => {
                  if (item.id === 'my' || (item as any).isMe) {
                    navigation.getParent()?.navigate('Phone');
                  } else {
                    navigation.navigate('ChatRoom', { userId: item.id, userName: item.displayName });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.storyAvatarWrap, { borderColor: (item as any).isMe || item.id === 'my' ? '#A259FF' : '#F357A8' }] }>
                  <Image
                    source={item.avatar ? { uri: item.avatar } : defaultProfileImage}
                    style={styles.storyAvatar}
                  />
                  {'isMe' in item && item.isMe || item.id === 'my' ? (
                    <View style={styles.storyAddBtn}>
                      <Feather name="plus" size={12} color="#fff" />
                    </View>
                  ) : null}
                  {item.id !== 'my' && (
                    <View style={[styles.storyStatusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                  )}
                </View>
              </TouchableOpacity>
              <ThemedText style={styles.storyName}>{item.displayName.split(' ')[0]}</ThemedText>
            </View>
          );
        }}
      />
    </View>
  );
});
StoriesRow.displayName = 'StoriesRow';

const ProfileMenu = memo(function ProfileMenu({ visible, onClose, onEdit, onLogout }: any) {
  if (!visible) return null;
  return (
    <Pressable style={styles.profileMenuOverlay} onPress={onClose}>
      <View style={styles.profileMenuContainer}>
        <View style={styles.profileMenuArrow} />
        <View style={styles.profileMenuBox} onStartShouldSetResponder={() => true}>
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={styles.profileMenuBtn}>
            <ThemedText style={styles.profileMenuEdit}>Edit</ThemedText>
          </TouchableOpacity>
          <View style={styles.profileMenuDivider} />
          <TouchableOpacity onPress={onLogout} activeOpacity={0.7} style={styles.profileMenuBtn}>
            <ThemedText style={styles.profileMenuLogout}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
});
ProfileMenu.displayName = 'ProfileMenu';

// --- Main Screen ---

type ChatStackParamList = {
  ChatsList: undefined;
  ChatRoom: { userId: string; userName: string };
};

type ChatItem = {
  id: string;
  username: string;
  alias?: string;
  bio?: string;
  avatar?: string[];
  displayName: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

export default function ChatsListScreen() {
  const { user, logout, token } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ChatStackParamList, 'ChatsList'>>();
  const [lastMessages, setLastMessages] = useState<{ [userId: string]: { text: string; timestamp: number; from?: string } | null }>({});
  const [userStatuses, setUserStatuses] = useState<{ [userId: string]: { state: string; last_changed: number } | null }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [blockReportModalVisible, setBlockReportModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch connected users from backend
  useEffect(() => {
    if (!user?.id || !token) return;
    getConnectedUsers(user.id, token)
      .then(users => {
        setChats(users.map((u: any) => ({
          ...u,
          displayName: u.alias || u.username || '',
        })));
      })
      .catch(e => console.log(e.message || 'Failed to load connected users'));
  }, [user, token]);

  // Set current user's presence
  useEffect(() => {
    if (!user?.id) return;
    const userStatusRef = ref(db, `status/${user.id}`);
    set(userStatusRef, { state: 'online', last_changed: serverTimestamp() });
    onDisconnect(userStatusRef).set({ state: 'offline', last_changed: serverTimestamp() });
    return () => {
      set(userStatusRef, { state: 'offline', last_changed: serverTimestamp() });
    };
  }, [user?.id]);

  // Listen for other users' presence
  useEffect(() => {
    if (!user?.id) return;
    const listeners: (() => void)[] = [];
    
    chats.forEach((chatUser) => {
      const statusRef = ref(db, `status/${chatUser.id}`);
      const handle = onValue(statusRef, (snapshot) => {
        setUserStatuses(prev => ({ ...prev, [chatUser.id]: snapshot.val() }));
      });
      listeners.push(() => off(statusRef, 'value', handle));
    });
    
    return () => { listeners.forEach(unsub => unsub()); };
  }, [chats, user?.id]);

  // Filter chats by searchText
  const filteredChats = searchText.trim()
    ? chats.filter(u => u.displayName.toLowerCase().includes(searchText.trim().toLowerCase()))
    : chats;

  useEffect(() => {
    if (!user) return;
    const listeners: (() => void)[] = [];
    chats.forEach((chatUser) => {
      const chatId = getChatId(user.id, chatUser.id);
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderByChild('timestamp'), limitToLast(1));
      const handle = onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lastMsg = Object.values(data)[0] as any;
          setLastMessages(prev => ({ ...prev, [chatUser.id]: { text: lastMsg.text, timestamp: lastMsg.timestamp, from: lastMsg.from } }));
        } else {
          setLastMessages(prev => ({ ...prev, [chatUser.id]: null }));
        }
      });
      listeners.push(() => off(q, 'value', handle));
    });
    return () => { listeners.forEach(unsub => unsub()); };
  }, [chats, user]);

  // Listen for unread messages count
  useEffect(() => {
    if (!user) return;
    const listeners: (() => void)[] = [];
    chats.forEach((chatUser) => {
      const chatId = getChatId(user.id, chatUser.id);
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      const handle = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Count messages that are addressed to current user and not read
          const unreadCount = Object.values(data).filter((msg: any) => 
            msg.to === user.id && msg.status !== 'read'
          ).length;
          setUnreadCounts(prev => ({ ...prev, [chatUser.id]: unreadCount }));
        } else {
          setUnreadCounts(prev => ({ ...prev, [chatUser.id]: 0 }));
        }
      });
      listeners.push(() => off(messagesRef, 'value', handle));
    });
    return () => { listeners.forEach(unsub => unsub()); };
  }, [chats, user]);

  // Reload data when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !token) return;
      
      // Reload connected users
      getConnectedUsers(user.id, token)
        .then(users => {
          setChats(users.map((u: any) => ({
            ...u,
            displayName: u.alias || u.username || '',
          })));
        })
        .catch(e => console.log(e.message || 'Failed to load connected users'));
    }, [user?.id, token])
  );

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const SNAP_TOP = 80;
  const SNAP_BOTTOM = SCREEN_HEIGHT * 0.38;

  // Clear unread count when navigating to a chat
  const handleChatPress = (userId: string, userName: string) => {
    // Clear unread count for this chat
    setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    navigation.navigate('ChatRoom', { userId, userName });
  };

  // Handle block/report actions
  const handleBlockReport = (user: any) => {
    setSelectedUser(user);
    setBlockReportModalVisible(true);
  };

  const handleBlockStatusChange = (isBlocked: boolean) => {
    if (isBlocked && selectedUser) {
      // Remove user from chat list when blocked
      setChats(prev => prev.filter(chat => chat.id !== selectedUser.id));
    }
  };

  // Draggable chat list container
  const translateY = useSharedValue(SNAP_BOTTOM);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateY.value = Math.max(SNAP_TOP, Math.min(SNAP_BOTTOM, ctx.startY + event.translationY));
    },
    onEnd: (event) => {
      if (event.translationY < -50) {
        translateY.value = withSpring(SNAP_TOP);
      } else {
        translateY.value = withSpring(SNAP_BOTTOM);
      }
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSearchVisible(true)}>
          <Feather name="search" size={24} color="#fff" />
        </TouchableOpacity>
        {searchVisible ? (
          <View style={styles.searchBoxWrap}>
            <TextInput
              autoFocus
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search contacts..."
              placeholderTextColor="#B7B3D7"
              style={styles.searchBox}
              onBlur={() => {
                setSearchVisible(false);
                setSearchText('');
              }}
              returnKeyType="search"
            />
          </View>
        ) : (
          <View style={styles.headerTitleContainer}>
            <ThemedText type="title" style={styles.headerTitle}>Home</ThemedText>
            {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
              <View style={styles.totalUnreadBadge}>
                <ThemedText style={styles.totalUnreadText}>
                  {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 99 ? '99+' : Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
                </ThemedText>
              </View>
            )}
          </View>
        )}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => setProfileMenuVisible(true)}>
            <View style={styles.profileAvatarOuter}>
              <View style={styles.profileAvatarInner}>
                <Image source={user?.avatar ? { uri: user.avatar } : defaultProfileImage} style={styles.profileAvatarImg} />
              </View>
              <View style={styles.profileStatusDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {/* Stories Row */}
      <StoriesRow user={user} chats={chats} navigation={navigation} userStatuses={userStatuses} />
      {/* Draggable Chat List */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.chatListContainer, { height: SCREEN_HEIGHT }, animatedStyle]}>
          <View style={styles.chatListHandle} />
          <FlatList
            data={filteredChats}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            renderItem={({ item }) => (
              <ChatListItem
                item={item}
                lastMsg={lastMessages[item.id]}
                userStatus={userStatuses[item.id]}
                unreadCount={unreadCounts[item.id] || 0}
                onPress={() => handleChatPress(item.id, item.displayName)}
                onBlockReport={handleBlockReport}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="users" size={64} color="#666" />
                <ThemedText style={styles.emptyStateText}>
                  No connected users
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Connect with creators to start chatting
                </ThemedText>
              </View>
            }
          />
        </Animated.View>
      </PanGestureHandler>
      <ProfileMenu
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        onEdit={() => {
          setProfileMenuVisible(false);
          navigation.getParent()?.navigate('Phone');
        }}
        onLogout={() => {
          setProfileMenuVisible(false);
          logout();
        }}
      />
      
      {/* Block/Report Modal */}
      <BlockReportModal
        visible={blockReportModalVisible}
        onClose={() => setBlockReportModalVisible(false)}
        targetUser={selectedUser}
        onBlockStatusChange={handleBlockStatusChange}
      />
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1B2D',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 40 : 24,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalUnreadBadge: {
    backgroundColor: '#F357A8',
    borderRadius: 9999,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Sora-Bold',
  },
  searchBoxWrap: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  searchBox: {
    backgroundColor: '#23213A',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    width: '100%',
  },
  profileAvatarOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1C1B2D',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#23213A',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  profileAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#262641',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23213A',
  },
  profileAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#FF3B30',
  },
  storiesRow: {
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 0,
    height: 90,
  },
  storiesList: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  storyAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#23213A',
  },
  storyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  storyAddBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#7B2FF2',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#23213A',
  },
  storyStatusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#95999C',
    borderWidth: 2,
    borderColor: '#23213A',
  },
  storyName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  chatListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#262641',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 8,
    paddingTop: 12,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  chatListHandle: {
    alignItems: 'center',
    margin: 'auto',
    width: '15%',
    height: 4,
    borderRadius: 4,
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  chatList: {
    padding: 10,
    paddingBottom: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#23213A',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chatItemPressed: {
    backgroundColor: 'rgba(122, 99, 255, 0.12)',
  },
  avatarOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1C1B2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
    backgroundColor: '#23213A',
  },
  avatarMiddle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#262641',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23213A',
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23213A',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 6,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#95999C',
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#95999C',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    padding: 0,
    lineHeight: 18,
  },
  unreadChatName: {
    fontWeight: '900',
  },
  chatMsg: {
    color: '#B7B3D7',
    opacity: 0.9,
    fontSize: 12,
    textAlign: 'justify',
    marginTop: 0,
    padding: 0,
    lineHeight: 15,
  },
  unreadChatMsg: {
    fontFamily: 'Sora-Bold',
    color: '#fff',
    opacity: 1,
  },
  chatMeta: {
    alignItems: 'flex-end',
    minWidth: 60,
    justifyContent: 'center',
  },
  chatTime: {
    color: '#B7B3D7',
    opacity: 0.7,
    fontSize: 11,
    marginBottom: 4,
  },
  unreadChatTime: {
    color: '#F357A8',
    opacity: 1,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#F357A8',
    borderRadius: 9999,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Sora-Bold',
  },
  profileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  profileMenuContainer: {
    position: 'absolute',
    top: 80,
    right: 8,
  },
  profileMenuArrow: {
    position: 'absolute',
    top: -10,
    right: 24,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(35,33,58,0.95)',
    zIndex: 2001,
  },
  profileMenuBox: {
    backgroundColor: 'rgba(35,33,58,0.95)',
    borderRadius: 4,
    paddingVertical: 6,
    minWidth: 60,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(162,89,255,0.18)',
    alignItems: 'stretch',
  },
  profileMenuBtn: {
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  profileMenuEdit: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: '#35345A',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  profileMenuLogout: {
    color: '#F357A8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 