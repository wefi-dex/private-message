import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { db } from '@/constants/firebase';
import { formatMessageTime, getChatId } from '@/utils/chatUtils';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { limitToLast, off, onValue, orderByChild, query, ref } from 'firebase/database';
import React, { useState, useEffect, memo } from 'react';
import { Dimensions, FlatList, Image, Pressable, TextInput, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getUsers } from '@/utils/api';

const defaultProfileImage = require('@/assets/images/default-contact-2.png');

// --- Components ---

const ChatListItem = memo(function ChatListItem({ item, lastMsg, onPress }: any) {
  const displayName = item.displayName;
  const lastMessageTime = lastMsg ? formatMessageTime(lastMsg.timestamp) : '';
  const unreadCount = 0;
  return (
    <Pressable
      onPress={onPress}
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
        <View style={styles.statusDot} />
      </View>
      <View style={styles.chatContent}>
        <ThemedText type="title" style={styles.chatName}>{displayName}</ThemedText>
        <ThemedText style={styles.chatMsg}>{lastMsg ? (lastMsg.from === item.id ? `You: ${lastMsg.text}` : lastMsg.text) : ''}</ThemedText>
      </View>
      <View style={styles.chatMeta}>
        <ThemedText style={styles.chatTime}>{lastMessageTime}</ThemedText>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
});
ChatListItem.displayName = 'ChatListItem';

const StoriesRow = memo(function StoriesRow({ user, chats, navigation }: any) {
  return (
    <View style={styles.storiesRow}>
      <FlatList
        data={[{ id: 'my', displayName: 'My status', isMe: true, avatar: user?.avatar }, ...chats.slice(0, 8)]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.storiesList}
        renderItem={({ item }) => (
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
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.storyName}>{item.displayName.split(' ')[0]}</ThemedText>
          </View>
        )}
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
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);

  // Fetch users from backend
  useEffect(() => {
    if (!user) return;
    getUsers(token || undefined)
      .then(users => {
        // Only filter out current user if user.id is defined and matches
        const filtered = users.filter((u: any) => !user.id || u.id !== user.id);
        // Debug: log the user list
        setChats(filtered.map((u: any) => ({
          ...u,
          displayName: u.alias || u.username || '',
        })));
      })
      .catch(e => console.log(e.message || 'Failed to load users'));
  }, [user, token]);

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
          setLastMessages(prev => ({ ...prev, [chatUser.id]: { text: lastMsg.text, timestamp: lastMsg.timestamp } }));
        } else {
          setLastMessages(prev => ({ ...prev, [chatUser.id]: null }));
        }
      });
      listeners.push(() => off(q, 'value', handle));
    });
    return () => { listeners.forEach(unsub => unsub()); };
  }, [chats, user]);

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const SNAP_TOP = 80;
  const SNAP_BOTTOM = SCREEN_HEIGHT * 0.38;

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
          <ThemedText type="title" style={styles.headerTitle}>Home</ThemedText>
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
      <StoriesRow user={user} chats={chats} navigation={navigation} />
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
                onPress={() => navigation.navigate('ChatRoom', { userId: item.id, userName: item.displayName })}
              />
            )}
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
    marginBottom: 8,
    width: '100%',
    height: 16,
    justifyContent: 'center',
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
  chatMsg: {
    color: '#B7B3D7',
    opacity: 0.9,
    fontSize: 12,
    textAlign: 'justify',
    marginTop: 0,
    padding: 0,
    lineHeight: 15,
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
}); 