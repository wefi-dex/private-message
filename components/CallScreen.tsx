import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const defaultProfileImage = require('@/assets/images/default-contact-2.png');

export default function CallScreen({ userName = 'Alex Wright', avatar, onEnd }: any) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  // Remove all WebRTC and mediaDevices logic

  return (
    <View style={styles.container}>
      <Image source={avatar || defaultProfileImage} style={styles.avatar} />
      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.status}>Calling...</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setMuted(m => !m)} style={styles.controlBtn}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEnd} style={[styles.controlBtn, styles.endBtn]}>
          <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSpeaker(s => !s)} style={styles.controlBtn}>
          <Ionicons name={speaker ? 'volume-high' : 'volume-mute'} size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1B2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    color: '#B7B3D7',
    fontSize: 16,
    marginBottom: 32,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlBtn: {
    backgroundColor: '#23213A',
    borderRadius: 32,
    padding: 18,
    marginHorizontal: 12,
  },
  endBtn: {
    backgroundColor: '#E94343',
  },
}); 