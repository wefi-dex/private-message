import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View } from 'react-native';
// @ts-ignore
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import VoiceMessageBubble from './VoiceMessageBubble';
import { getFileUrl } from '@/utils/api';

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
}

export default function ChatMessageBubble({ isMine, text, timestamp, status, showAvatar, user, audioUrl, audioDuration }: ChatMessageBubbleProps) {
  function formatTime(ts: number) {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  if (audioUrl) {
    return (
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
    );
  }

  return (
    <View style={{ flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 4 }}>
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
  );
} 