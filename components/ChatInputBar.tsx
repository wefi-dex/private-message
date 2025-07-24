import { uploadFile } from '@/utils/api';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from 'emoji-mart-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type MediaPayload =
  | { type: 'gif' | 'sticker' | 'audio' | 'file'; url: string } // Added 'file' here
  | { type: 'audio'; url: string; duration: number };

type Props = {
  input: string;
  handleInputChange: (text: string) => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  sendMessage: () => void;
  handleSendMedia?: (media: MediaPayload) => void;
  onInputHeightChange?: (height: number) => void;
};

const iconProps = { size: 22, color: '#fff' };
const STICKERS = [
  require('@/assets/images/emoji.png'),
  require('@/assets/images/atIcon.png'),
  require('@/assets/images/apple.png'),
  require('@/assets/images/facebook.png'),
  require('@/assets/images/google.png'),
];

const GIPHY_TRENDING_URL = 'https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=24';

const ChatInputBar = ({
  input, handleInputChange, handleInputFocus, handleInputBlur, sendMessage, handleSendMedia, onInputHeightChange,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (pickerTab === 'gif' && gifs.length === 0 && !loadingGifs) {
      setLoadingGifs(true);
      fetch(GIPHY_TRENDING_URL)
        .then(res => res.json())
        .then(data => setGifs(data.data || []))
        .finally(() => setLoadingGifs(false));
    }
  }, [pickerTab]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        setIsRecording(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      // Track duration
      let isRecordingActive = true;
      const interval = setInterval(async () => {
        if (isRecordingActive) {
          const status = await rec.getStatusAsync();
          if (status.isRecording) {
            setRecordingDuration(Math.floor((status.durationMillis || 0) / 1000));
          } else {
            isRecordingActive = false;
            clearInterval(interval);
          }
        }
      }, 500);
    } catch (err) {
      setIsRecording(false);
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordingUri(uri || null);
      if (uri && handleSendMedia) {
        handleSendMedia({ type: 'audio', url: uri, duration: recordingDuration });
      } else if (uri) {
        console.log('Recorded audio:', uri);
      }
      setRecordingDuration(0);
    } catch (err) {
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      alert('Failed to stop recording');
    }
  };

  // When send button is pressed while recording, stop and send audio
  const handleSend = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      sendMessage();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setUploadError('');
      try {
        const res = await uploadFile(file);
        if (handleSendMedia) handleSendMedia({ type: 'file', url: res.url });
      } catch (err: any) {
        setUploadError(err.message || 'File upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleNativeFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      setUploading(true);
      setUploadError('');
      try {
        // Fetch the file as a blob
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const res = await uploadFile(blob);
        if (handleSendMedia) handleSendMedia({ type: 'file', url: res.url });
      } catch (err: any) {
        setUploadError(err.message || 'File upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    handleInputChange(input + emoji.native);
    setEmojiPickerVisible(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    if (handleSendMedia) handleSendMedia({ type: 'gif', url: gifUrl });
    else console.log('Selected GIF:', gifUrl);
    setEmojiPickerVisible(false);
  };

  const handleStickerSelect = (sticker: any) => {
    if (handleSendMedia) handleSendMedia({ type: 'sticker', url: sticker });
    else console.log('Selected sticker:', sticker);
    setEmojiPickerVisible(false);
  };

  return (
    <View style={[styles.container, { flexDirection: 'row', alignItems: 'center' }]}> 
      {/* File browser button on the far left, no background */}
      {Platform.OS === 'web' ? (
        <>
          <label htmlFor="file-upload" style={{ marginLeft: 0, marginRight: 8, cursor: 'pointer', backgroundColor: 'transparent' }}>
            <AntDesign name="paperclip" size={24} color="white" />
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      ) : (
        <TouchableOpacity onPress={handleNativeFilePick} style={{ marginLeft: 0, marginRight: 8, backgroundColor: 'transparent' }}>
          <AntDesign name="paperclip" size={24} color="white" />
        </TouchableOpacity>
      )}
      {uploading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
      {uploadError ? <Text style={{ color: 'red', fontSize: 12 }}>{uploadError}</Text> : null}
      {/* Input bar and send button (center) */}
      <View style={[styles.inputBar, { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 0, marginRight: 0 }]}> 
        <TouchableOpacity onPress={() => setEmojiPickerVisible(true)}>
          <FontAwesome name="smile-o" {...iconProps} style={styles.icon} />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Type here..."
          style={styles.input}
          placeholderTextColor="#fff"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
          blurOnSubmit={false}
          // Note: React Native's TextInput on mobile does not support shiftKey or preventDefault.
          // Only Enter to send and Tab to insert tab are supported here.
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Enter') {
              sendMessage();
            } else if (e.nativeEvent.key === 'Tab') {
              handleInputChange(input + '\t');
            }
          }}
          onContentSizeChange={e => {
            if (typeof onInputHeightChange === 'function') {
              onInputHeightChange(e.nativeEvent.contentSize.height);
            }
          }}
        />
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={{ color: 'red', marginLeft: 4 }}>Recording...</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <MaterialCommunityIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* Speech recognition (microphone) button on the far right, no background */}
      {Platform.OS !== 'web' ? (
        <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={{ marginLeft: 8, backgroundColor: 'transparent' }}>
          <Feather name="mic" size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={{ marginLeft: 8, backgroundColor: 'transparent' }}>
          <Feather name="mic" size={24} color="white" />
        </TouchableOpacity>
      )}
      {/* Emoji/GIF/Sticker Picker Modal */}
      <Modal visible={emojiPickerVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#1C1B2D', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 8, maxHeight: 400 }}>
            {/* Tab Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
              <TouchableOpacity onPress={() => setPickerTab('emoji')} style={[styles.tab, pickerTab === 'emoji' && styles.tabActive]}>
                <Text style={{ fontSize: 10, color: pickerTab === 'emoji' ? '#fff' : '#B7B3D7', fontFamily: 'Sora-SemiBold' }}>😀</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickerTab('gif')} style={[styles.tab, pickerTab === 'gif' && styles.tabActive]}>
                <Text style={{ fontSize: 10, color: pickerTab === 'gif' ? '#fff' : '#B7B3D7', fontFamily: 'Sora-SemiBold' }}>GIF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickerTab('sticker')} style={[styles.tab, pickerTab === 'sticker' && styles.tabActive]}>
                <Text style={{ fontSize: 10, color: pickerTab === 'sticker' ? '#fff' : '#B7B3D7', fontFamily: 'Sora-SemiBold' }}>🖼️</Text>
              </TouchableOpacity>
            </View>
            {/* Tab Content */}
            {pickerTab === 'emoji' && <Picker onSelect={handleEmojiSelect} theme="dark" />}
            {pickerTab === 'gif' && (
              loadingGifs ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
              ) : (
                <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {gifs.map(gif => (
                    <TouchableOpacity key={gif.id} onPress={() => handleGifSelect(gif.images.fixed_height.url)}>
                      <Image source={{ uri: gif.images.fixed_height.url }} style={{ width: 80, height: 80, margin: 4, borderRadius: 8 }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )
            )}
            {pickerTab === 'sticker' && (
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {STICKERS.map((sticker, idx) => (
                  <TouchableOpacity key={idx} onPress={() => handleStickerSelect(sticker)}>
                    <Image source={sticker} style={{ width: 80, height: 80, margin: 4, borderRadius: 8 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setEmojiPickerVisible(false)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <FontAwesome name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23213A',
    borderRadius: 28,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    maxHeight: 120,
  },
  icon: { marginHorizontal: 8 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#23213A',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#35345A',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInputBar; 