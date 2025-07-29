import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoiceMessageBubbleProps {
  isMine: boolean;
  url: string;
  duration?: number;
}

export default function VoiceMessageBubble({ isMine, url, duration }: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);

  const playPause = async () => {
    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, {}, (status) => setPlaybackStatus(status));
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          setPlaybackStatus(status);
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  // Format duration as mm:ss
  const formatDuration = (d?: number) => {
    if (!d) return '0:00';
    const min = Math.floor(d / 60);
    const sec = d % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={isMine ? ["#7426D0", "#A960E0"] : ["#35345A", "#23213A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1.75, y: 0 }}
      style={styles.bubble}
    >
      <TouchableOpacity onPress={playPause} style={styles.playButton}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
      </TouchableOpacity>
      {/* Static waveform SVG or bars */}
      <View style={styles.waveform}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: 10 + 10 * Math.abs(Math.sin(i)),
              backgroundColor: 'white',
              borderRadius: 2,
              marginHorizontal: 1,
              opacity: 0.7,
            }}
          />
        ))}
      </View>
      <Text style={styles.duration}>{formatDuration(duration)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: 320,
    minWidth: 120,
    marginVertical: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    marginLeft: 2,
    height: 28,
  },
  duration: {
    color: '#fff',
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
    minWidth: 40,
    textAlign: 'right',
  },
}); 