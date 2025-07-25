import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View, TouchableWithoutFeedback, Modal, TouchableOpacity, Clipboard, Alert, useWindowDimensions, ScrollView } from 'react-native';
// @ts-ignore
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import VoiceMessageBubble from './VoiceMessageBubble';
import { getFileUrl } from '@/utils/api';
import { BlurView } from 'expo-blur';
import Feather from '@expo/vector-icons/Feather';
import { update, ref } from 'firebase/database';
import { db } from '@/constants/firebase';

const defaultProfileImage = require('@/assets/images/default-contact-2.png');

function getAvatarSource(user: any): any {
  if (user && user.avatar) {
    const filename = Array.isArray(user.avatar) ? user.avatar[0] : user.avatar;
    if (filename) {
      return { uri: getFileUrl(filename) };
    }
  }
  return defaultProfileImage;
}

interface ChatMessageBubbleProps {
  isMine: boolean;
  text: string;
  timestamp: number;
  status: string;
  showAvatar: boolean;
  user?: any; // Pass the user object for avatar
  audioUrl?: string;
  audioDuration?: number;
  messageId: string;
  chatId: string;
  userId: string;
  reactions: { [userId: string]: string };
}

export default function ChatMessageBubble({ isMine, text, timestamp, status, showAvatar, user, audioUrl, audioDuration, messageId, chatId, userId, reactions }: ChatMessageBubbleProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuY, setMenuY] = React.useState<number | null>(null);
  const [menuX, setMenuX] = React.useState<number | null>(null);
  const bubbleRef = React.useRef<View>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [selectedReaction, setSelectedReaction] = React.useState<string | null>(null);
  const emojiReactions = [
    '👍', '🥂', '🤝', '❤️', '🥳', '🔥', '👌',
    '😂', '😢', '👏', '😮', '😡', '🙏', '💯',
    '😎', '🤔', '😱', '🎉', '😅', '😇', '🤩',
    '😜', '😏', '😬', '😴', '🤗', '😆', '😋',
    '😐', '😳', '😔', '😤', '😇', '😈', '💔',
    '😇', '😷', '🤒', '🤕', '🤢', '🤮', '🥶',
    '🥵', '🥴', '🤠', '🤡', '👻', '💀', '👽',
    '👋', '🤙', '✌️', '🤞', '🖖', '🤟', '🤘',
    '👐', '🙌', '👏', '🙏', '💪', '🦾', '🦵',
    '👀', '👁️', '👅', '👄', '💋', '🧠', '🦷',
    '🦴', '👶', '🧒', '👦', '👧', '🧑', '👨',
    '👩', '🧓', '👴', '👵', '👲', '👳‍♂️', '👳‍♀️',
    '🧕', '👮‍♂️', '👮‍♀️', '👷‍♂️', '👷‍♀️', '💂‍♂️', '💂‍♀️',
    '🕵️‍♂️', '🕵️‍♀️', '👩‍⚕️', '👨‍⚕️', '👩‍🎓', '👨‍🎓', '👩‍🏫',
    '👨‍🏫', '👩‍⚖️', '👨‍⚖️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳',
    '👩‍🔧', '👨‍🔧', '👩‍🏭', '👨‍🏭', '👩‍💼', '👨‍💼', '👩‍🔬',
    '👨‍🔬', '👩‍💻', '👨‍💻', '👩‍🎤', '👨‍🎤', '👩‍🎨', '👨‍🎨',
    '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍🚒', '👨‍🚒', '🧑‍🚒',
    '🧑‍✈️', '🧑‍🚀', '🧑‍🎄', '🧑‍🎤', '🧑‍🎨', '🧑‍🔬', '🧑‍💻',
    '🧑‍🍳', '🧑‍🌾', '🧑‍🏫', '🧑‍⚖️', '🧑‍🔧', '🧑‍🏭', '🧑‍💼',
  ];

  function formatTime(ts: number) {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const handleLongPress = (event: any) => {
    const { pageY, pageX } = event.nativeEvent;
    setMenuY(pageY);
    setMenuX(pageX);
    setMenuVisible(true);
  };
  const handleCloseMenu = () => setMenuVisible(false);

  const handleReply = () => { setMenuVisible(false); Alert.alert('Reply', 'Reply action'); };
  const handleDelete = () => { setMenuVisible(false); Alert.alert('Delete', 'Delete action'); };
  const handleEdit = () => { setMenuVisible(false); Alert.alert('Edit', 'Edit action'); };
  const handleSelect = () => { setMenuVisible(false); Alert.alert('Select', 'Select action'); };
  const handleCopy = () => { setMenuVisible(false); Clipboard.setString(text); Alert.alert('Copied', 'Message copied to clipboard'); };

  const handleReaction = (emoji: string) => {
    setMenuVisible(false);
    if (!messageId || !chatId || !userId) return;
    // Update the reaction in Firebase
    update(ref(db, `chats/${chatId}/messages/${messageId}/reactions`), {
      [userId]: emoji,
    });
  };

  if (audioUrl) {
    return (
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 4 }}>
          {!isMine && showAvatar ? (
            <Image
              source={getAvatarSource(user)}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
            />
          ) : (
            <View style={{ width: 32, height: 32, marginRight: 8 }} />
          )}
          <VoiceMessageBubble isMine={isMine} url={audioUrl} duration={audioDuration} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Group reactions by emoji and count
  const reactionCounts: { [emoji: string]: number } = {};
  Object.values(reactions || {}).forEach((emoji) => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });

  return (
    <>
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View ref={bubbleRef} style={{ flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 4 }}>
          {!isMine && showAvatar ? (
            <Image
              source={getAvatarSource(user)}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
            />
          ) : (
            <View style={{ width: 32, height: 32, marginRight: 8 }} />
          )}
          {isMine ? (
            <LinearGradient
              colors={["#6E33BD", "#AD60EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1.75, y: 0 }}
              style={{
                alignSelf: 'flex-end',
                borderRadius: 24,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 24,
                paddingVertical: 12,
                paddingHorizontal: 24,
                maxWidth: '75%',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <ThemedText
                style={{
                  color: '#fff',
                  fontFamily: 'Sora-SemiBold',
                  fontSize: 15,
                  minWidth: 0,
                }}
              >
                {text}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 }}>
                <ThemedText style={{ color: '#fff', fontSize: 11, opacity: 0.7, marginRight: 4 }}>
                  {formatTime(timestamp)}
                </ThemedText>
                {status === 'read' ? (
                  <FontAwesome5 name="check-double" size={14} color="#fff" style={{ opacity: 0.7 }} />
                ) : (
                  <FontAwesome5 name="check" size={14} color="#fff" style={{ opacity: 0.7 }} />
                )}
              </View>
            </LinearGradient>
          ) : (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#3D3C5B',
                borderRadius: 24,
                borderBottomRightRadius: 24,
                borderTopLeftRadius: 4,
                paddingVertical: 12,
                paddingHorizontal: 24,
                maxWidth: '75%',
              }}
            >
              <ThemedText
                style={{
                  color: '#fff',
                  fontFamily: 'Sora-SemiBold',
                  fontSize: 15,
                  minWidth: 0,
                }}
              >
                {text}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 6 }}>
                <ThemedText style={{ color: '#fff', fontSize: 11, opacity: 0.7 }}>
                  {formatTime(timestamp)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      {/* Show reactions below the bubble */}
      {Object.keys(reactionCounts).length > 0 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 2,
          alignSelf: isMine ? 'flex-end' : 'flex-start',
          marginRight: isMine ? 40 : 0,
          marginLeft: isMine ? 0 : 40,
        }}>
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <View key={emoji} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(162,89,255,0.13)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 }}>
              <ThemedText style={{ fontSize: 16 }}>{emoji}</ThemedText>
              {count > 1 && <ThemedText style={{ fontSize: 13, color: '#A259FF', marginLeft: 2 }}>{count}</ThemedText>}
            </View>
          ))}
        </View>
      )}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} activeOpacity={1} onPress={handleCloseMenu} />
        <View style={{
          position: 'absolute',
          left: menuX !== null ? Math.max(16, Math.min(menuX - 120, windowWidth - 256)) : 32,
          top: menuY !== null ? Math.max(32, Math.min(menuY, windowHeight - 320)) : '38%',
          width: 240,
          borderRadius: 22,
          overflow: 'hidden',
          alignItems: 'center',
          elevation: 12
        }}>
          <BlurView intensity={40} tint="dark" style={{ width: '100%', padding: 0, borderRadius: 22 }}>
            <View style={{ paddingVertical: 18, paddingHorizontal: 0, alignItems: 'center', width: 240 }}>
              {/* Reaction emoji bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ width: 240, alignSelf: 'center', marginBottom: 16, marginTop: 2, overflow: 'visible' }} contentContainerStyle={{ paddingHorizontal: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {emojiReactions.map((emoji, idx) => (
                    <TouchableOpacity
                      key={emoji + '-' + idx}
                      onPress={() => handleReaction(emoji)}
                      style={{
                        marginHorizontal: 4,
                        padding: 4,
                        borderRadius: 8,
                        backgroundColor: selectedReaction === emoji ? 'rgba(162,89,255,0.18)' : 'transparent',
                        borderWidth: selectedReaction === emoji ? 1 : 0,
                        borderColor: selectedReaction === emoji ? '#A259FF' : 'transparent',
                      }}
                    >
                      <ThemedText style={{ fontSize: 24 }}>{emoji}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {/* Reaction/drag bar */}
              <View style={{ width: 56, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', marginBottom: 6, marginTop: 2, shadowColor: '#fff', shadowOpacity: 0.18, shadowRadius: 4 }} />
              <MenuOption icon={<Feather name="corner-up-left" size={20} color="#A259FF" />} label="Reply" onPress={handleReply} />
              <MenuDivider />
              <MenuOption icon={<Feather name="trash-2" size={20} color="#FF5A5A" />} label="Delete" onPress={handleDelete} />
              {isMine && <><MenuDivider /><MenuOption icon={<Feather name="edit-2" size={20} color="#FFD700" />} label="Edit" onPress={handleEdit} /></>}
              <MenuDivider />
              <MenuOption icon={<Feather name="check-square" size={20} color="#6B47DC" />} label="Select" onPress={handleSelect} />
              <MenuDivider />
              <MenuOption icon={<Feather name="copy" size={20} color="#fff" />} label="Copy" onPress={handleCopy} />
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const MenuOption = ({ icon, label, onPress }: { icon: React.ReactNode, label: string, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, width: '100%' }}>
    {icon}
    <ThemedText style={{ color: '#fff', fontSize: 15, marginLeft: 16 }}>{label}</ThemedText>
  </TouchableOpacity>
);
const MenuDivider = () => (
  <View style={{ width: '90%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'center' }} />
); 