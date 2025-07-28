import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from "@/constants/Colors";
import { db } from '@/constants/firebase';
import { getChatId } from '@/utils/chatUtils';
import { FontAwesome } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { get, off, onDisconnect, onValue, orderByChild, push, query, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import React from 'react';
import { Alert, Clipboard, FlatList, Image, KeyboardAvoidingView, Platform, TouchableOpacity, View } from 'react-native';
import CallScreen from './CallScreen';
import ChatInputBar from './ChatInputBar';
import ChatMessageBubble from './ChatMessageBubble';
import BlockReportModal from './BlockReportModal';

export default function ChatRoomScreen(props: any) {
  const { user } = useAuth();
  const navigation = useNavigation();
  // Extract userId, userName, and chatId at the top
  const { userId, userName } = props.route.params;
  const chatId = user ? getChatId(user?.id, userId) : '';
  // All useState hooks must be at the top level
  const [showCall, setShowCall] = React.useState(false);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [input, setInput] = React.useState('');
  const [inputFocused, setInputFocused] = React.useState(false);
  const [inputBoxHeight, setInputBoxHeight] = React.useState(56); // default input bar height
  const [otherUserState, setOtherUserState] = React.useState<{ state: string, last_changed: number } | null>(null);
  const [isOtherTyping, setIsOtherTyping] = React.useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [newMessageCount, setNewMessageCount] = React.useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const isAtBottomRef = React.useRef(true);
  const [editingMessage, setEditingMessage] = React.useState<any>(null);
  const [selectedMessages, setSelectedMessages] = React.useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [blockReportModalVisible, setBlockReportModalVisible] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);


  // All useEffect and useCallback hooks must also be before any early return
  React.useEffect(() => {
    // Listen for other user's presence
    const statusRef = ref(db, `status/${userId}`);
    const handle = onValue(statusRef, (snapshot) => {
      setOtherUserState(snapshot.val());
    });
    return () => off(statusRef, 'value', handle);
  }, [userId]);

  React.useEffect(() => {
    // Set current user's presence
    if (!user) return;
    const userStatusRef = ref(db, `status/${user.id}`);
    set(userStatusRef, { state: 'online', last_changed: serverTimestamp() });
    onDisconnect(userStatusRef).set({ state: 'offline', last_changed: serverTimestamp() });
    return () => {
      set(userStatusRef, { state: 'offline', last_changed: serverTimestamp() });
    };
  }, [user]);

  // Typing indicator state and refs
  const typingRef = ref(db, `chats/${chatId}/typing/${user?.id}`);
  const otherTypingRef = ref(db, `chats/${chatId}/typing/${userId}`);

  // Listen for other user's typing status
  React.useEffect(() => {
    const handle = onValue(otherTypingRef, (snapshot) => {
      setIsOtherTyping(!!snapshot.val());
    });
    return () => off(otherTypingRef, 'value', handle);
  }, [chatId, userId]);

  // Set typing status in Firebase
  const setTypingStatus = (isTyping: boolean) => {
    if (isTyping) {
      set(typingRef, true);
    } else {
      remove(typingRef);
    }
  };

  // Handle input change and debounce typing status
  const handleInputChange = (text: string) => {
    setInput(text);
    if (text.length > 0) {
      setTypingStatus(true);
    } else if (!inputFocused) {
      setTypingStatus(false);
    }
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    if (input.length > 0) setTypingStatus(true);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    if (input.length === 0) setTypingStatus(false);
  };

  // Clean up typing status on unmount
  React.useEffect(() => {
    return () => {
      setTypingStatus(false);
    };
  }, []);

  React.useEffect(() => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderByChild('timestamp'));
    const handle = onValue(q, (snapshot) => {
      const data = snapshot.val() || {};
      // Attach the Firebase key as 'id' to each message
      const msgList = Object.entries(data).map(([id, msg]: [string, any]) => ({ ...msg, id })).sort((a: any, b: any) => a.timestamp - b.timestamp);
      setMessages(msgList);
    });
    return () => off(q, 'value', handle);
  }, [chatId]);

  // --- READ RECEIPT LOGIC ---
  // Only mark messages as 'read' if they are addressed to the current user (msg.to === user.id).
  // This ensures that only the recipient marks a message as read, so the sender will see ✓✓ when the other user has read their message.
  React.useEffect(() => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    get(messagesRef).then(snapshot => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([key, msg]: [string, any]) => {
        if (msg.to === user?.id && msg.status !== 'read') {
          update(ref(db, `chats/${chatId}/messages/${key}`), { status: 'read' });
        }
      });
    });
  }, [chatId, user?.id]);



  const sendMessage = () => {
    if (input.trim()) {
      if (editingMessage) {
        // Update existing message
        const messageRef = ref(db, `chats/${chatId}/messages/${editingMessage.id}`);
        update(messageRef, {
          text: input,
          edited: true,
          editedAt: Date.now(),
        });
        setEditingMessage(null);
      } else {
        // Send new message
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        push(messagesRef, {
          text: input,
          from: user?.id,
          to: userId,
          timestamp: Date.now(),
          status: 'sent',
        });
      }
      setInput('');
      setTypingStatus(false);
    }
  };

  const handleEditMessage = (message: any) => {
    setEditingMessage(message);
    setInput(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInput('');
  };

  const handleDeleteMessage = (message: any) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (message.id) {
              const messageRef = ref(db, `chats/${chatId}/messages/${message.id}`);
              remove(messageRef);
            }
          },
        },
      ]
    );
  };

  const handleSelectMessage = (message: any) => {
    // Cancel editing if in edit mode
    if (editingMessage) {
      setEditingMessage(null);
      setInput('');
    }
    
    if (isSelectionMode) {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(message.id)) {
          newSet.delete(message.id);
        } else {
          newSet.add(message.id);
        }
        return newSet;
      });
    } else {
      setIsSelectionMode(true);
      setSelectedMessages(new Set([message.id]));
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Messages',
      `Are you sure you want to delete ${selectedMessages.size} message${selectedMessages.size !== 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedMessages.forEach(messageId => {
              const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
              remove(messageRef);
            });
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleBulkCopy = () => {
    const selectedMessageTexts = messages
      .filter(msg => selectedMessages.has(msg.id))
      .map(msg => msg.text || `Voice message (${msg.audioDuration}s)`)
      .join('\n\n');
    
    Clipboard.setString(selectedMessageTexts);
    Alert.alert('✓ Copied', `${selectedMessages.size} message${selectedMessages.size !== 1 ? 's' : ''} copied to clipboard`, [{ text: 'OK' }], { cancelable: true });
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectionMode(false);
    // If we were editing, restore the edit mode
    if (editingMessage) {
      setInput(editingMessage.text);
    }
  };

  // --- Group messages by day and insert label items ---
  const messagesWithLabels: Array<any> = [];
  let lastLabel = '';
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgDate = new Date(msg.timestamp);
    const label = getDayLabel(msgDate);
    if (label !== lastLabel) {
      messagesWithLabels.push({ type: 'label', label, key: `label-${label}-${msg.timestamp}` });
      lastLabel = label;
    }
    messagesWithLabels.push({ ...msg, type: 'message', key: msg.id || `msg-${i}` });
  }

  // Helper to mark all unread messages addressed to this user as read
  const markMessagesAsRead = React.useCallback(() => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    get(messagesRef).then(snapshot => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([key, msg]: [string, any]) => {
        if (msg.to === user?.id && msg.status !== 'read') {
          update(ref(db, `chats/${chatId}/messages/${key}`), { status: 'read' });
        }
      });
    });
  }, [chatId, user?.id]);

  // Mark messages as read when entering the chat room
  React.useEffect(() => {
    if (chatId && user?.id) {
      // Small delay to ensure the chat is fully loaded
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chatId, user?.id, markMessagesAsRead]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40; // px
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isAtBottomRef.current = isAtBottom;
    setShowScrollToBottom(!isAtBottom);
    if (isAtBottom) {
      setNewMessageCount(0);
      markMessagesAsRead();
    }
  };

  React.useEffect(() => {
    if (isAtBottomRef.current) {
      // If at bottom, scroll to end and reset count
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setNewMessageCount(0);
    } else {
      // If not at bottom, increment new message count
      setNewMessageCount((count) => count + 1);
      setShowScrollToBottom(true);
    }
  }, [messages.length]);

  // Mark as read when new messages arrive and user is at bottom
  React.useEffect(() => {
    if (isAtBottomRef.current) {
      markMessagesAsRead();
    }
  }, [messages.length, markMessagesAsRead]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
    setNewMessageCount(0);
    markMessagesAsRead();
  };

  function getDayLabel(date: Date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Helper to determine if avatar should be shown for incoming messages
  function shouldShowAvatar(messages: any[], index: number, userId: string) {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    return prev.from !== curr.from;
  }

  const defaultProfileImage = require('@/assets/images/default-contact-2.png');



  if (!user) {
    return null;
  }

  return (
    <ThemedView style={{ flex: 1, padding: 0 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: 15, backgroundColor: '#1C1B2D', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: 70, zIndex: 20, }}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <FontAwesome name="chevron-left" size={24} color="#e1e1e1" />
        </TouchableOpacity>
        <View style={{ position: 'relative', marginRight: 14 }}>
          <Image
            source={user.avatar ? { uri: user.avatar[0] || user.avatar } : defaultProfileImage}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
          {/* Status icon at bottom left of avatar */}
          <View style={{
            position: 'absolute',
            left: 40,
            bottom: 2,
            width: 13,
            height: 13,
            borderRadius: 6.5,
            backgroundColor: otherUserState?.state === 'online' ? '#4AC959' : '#E94343',
            borderWidth: 2,
            borderColor: '#181634',
          }} />
        </View>
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
          <ThemedText type="title" style={{ color: '#fff', fontSize: 18 }}>{userName}</ThemedText>
          <ThemedText style={{ color: '#B7B3D7', fontSize: 13, marginTop: 2 }}>
            {otherUserState?.state === 'online' ? 'Active now' : 'Offline'}
          </ThemedText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => setShowCall(true)}>
            <FontAwesome5 name="phone" size={20} color="#B7B3D7" style={{ marginHorizontal: 8 }} />
          </TouchableOpacity>
          <FontAwesome5 name="video" size={20} color="#B7B3D7" style={{ marginHorizontal: 8 }} />
          <TouchableOpacity onPress={() => setBlockReportModalVisible(true)}>
            <FontAwesome5 name="ellipsis-v" size={20} color="#B7B3D7" style={{ marginHorizontal: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Selection Mode Header */}
      {isSelectionMode && (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: 16, 
          backgroundColor: '#2D2C5B', 
          borderBottomWidth: 1, 
          borderBottomColor: '#35345A' 
        }}>
          <TouchableOpacity onPress={handleCancelSelection} style={{ marginRight: 16 }}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>
                     <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 }}>
             {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''} selected
           </ThemedText>
           <TouchableOpacity 
             onPress={handleBulkCopy} 
             style={{ 
               backgroundColor: '#6B47DC', 
               paddingHorizontal: 16, 
               paddingVertical: 8, 
               borderRadius: 20,
               marginRight: 8
             }}
           >
             <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
               Copy
             </ThemedText>
           </TouchableOpacity>
           <TouchableOpacity 
             onPress={handleBulkDelete} 
             style={{ 
               backgroundColor: '#FF5A5A', 
               paddingHorizontal: 16, 
               paddingVertical: 8, 
               borderRadius: 20 
             }}
           >
             <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
               Delete
             </ThemedText>
           </TouchableOpacity>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messagesWithLabels.filter(item => item.type === 'message')}
        keyExtractor={item => item.key}
        renderItem={({ item, index }) => {
          const isMine = item.from === user?.id;
          const showAvatar = !isMine && shouldShowAvatar(messagesWithLabels.filter(m => m.type === 'message'), index, user?.id);
          return (
            <ChatMessageBubble
              isMine={isMine}
              text={item.text}
              timestamp={item.timestamp}
              status={item.status}
              showAvatar={showAvatar}
              messageId={item.id}
              chatId={chatId}
              userId={user.id}
              reactions={item.reactions || {}}
              from={item.alias || item.username || item.from}
              onEdit={() => handleEditMessage(item)}
              edited={item.edited}
              onDelete={() => handleDeleteMessage(item)}
              onSelect={() => handleSelectMessage(item)}
              isSelected={selectedMessages.has(item.id)}
              isSelectionMode={isSelectionMode}
              onBlockReport={(user) => {
                setSelectedUser(user);
                setBlockReportModalVisible(true);
              }}
            />
          );
        }}
        style={{ flex: 1, paddingHorizontal: 12, marginTop: 0 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {showScrollToBottom && (
        <View style={{ position: 'absolute', right: 24, bottom: Math.min(inputBoxHeight, 120) + 40, zIndex: 10 }} pointerEvents="box-none">
          <TouchableOpacity
            onPress={scrollToBottom}
            style={{
              backgroundColor: Colors.light.primary,
              borderRadius: 9999,
              padding: 10,
              elevation: 4,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 6,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
            accessibilityLabel="Scroll to latest message"
          >
            <ThemedText style={{ color: 'white', fontWeight: 'bold', fontSize: 16, width: 22, textAlign: 'center' }}>
              <FontAwesome5 name="angle-double-down" size={24} color={Colors.light.fontsemi} />
            </ThemedText>
            {newMessageCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  top: -12,
                  backgroundColor: "red",
                  borderRadius: 9999,
                  width: 22,
                  height: 22,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>
                  {newMessageCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      {isOtherTyping && (
        <View style={{ marginBottom: 4, alignItems: 'flex-start' }}>
          <ThemedText style={{ color: Colors.light.semiprimary, fontStyle: 'italic' }}>
            {userName} is typing...
          </ThemedText>
        </View>
      )}
      {/* CallScreen Modal */}
      {showCall && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <CallScreen
            userName={userName}
            avatar={user.avatar ? { uri: user.avatar[0] || user.avatar } : defaultProfileImage}
            onEnd={() => setShowCall(false)}
          />
        </View>
      )}
      {!isSelectionMode && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ borderTopColor: "#2D2C5B", borderTopWidth: 1 }}>
          <ChatInputBar
            input={input}
            handleInputChange={handleInputChange}
            handleInputFocus={handleInputFocus}
            handleInputBlur={handleInputBlur}
            sendMessage={sendMessage}
            onInputHeightChange={setInputBoxHeight}
            editingMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
          />
        </KeyboardAvoidingView>
      )}
      
      {/* Block/Report Modal */}
      <BlockReportModal
        visible={blockReportModalVisible}
        onClose={() => setBlockReportModalVisible(false)}
        targetUser={selectedUser || {
          id: userId,
          displayName: userName,
        }}
        onBlockStatusChange={(isBlocked) => {
          if (isBlocked) {
            // Navigate back to chat list when user is blocked
            navigation.goBack();
          }
        }}
      />
    </ThemedView>
  );
} 