import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ChatCardProps {
  avatar?: any;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

const defaultAvatar = require('@/assets/images/apple.png');

export default function ChatCard({ avatar, name, lastMessage, lastMessageTime, unreadCount = 0 }: ChatCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'primary');
  return (
    <View style={[styles.container, { backgroundColor, borderBottomColor: borderColor }]}> 
      <Image source={avatar || defaultAvatar} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{lastMessageTime}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>{lastMessage}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Sora-Bold',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Sora',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 15,
    color: '#555',
    fontFamily: 'Sora',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5A0FC8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
}); 