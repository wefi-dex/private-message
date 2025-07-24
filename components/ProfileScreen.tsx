import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { getFileUrl, getUser, updateUser, uploadFile } from '@/utils/api';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

function ProfileDetailScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Profile Detail</ThemedText>
    </ThemedView>
  );
}

const ProfileStack = createStackNavigator();

function ProfileScreenWithTabBarHidden(props: any) {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
  return <ProfileDetailScreen {...props} />;
}

export default function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileDetail" component={ProfileScreenWithTabBarHidden} />
    </ProfileStack.Navigator>
  );
}

function ProfileScreen(props: any) {
  const { user, token, logout, updateUserContext } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photo, setPhoto] = useState<string | null>(user?.photo || null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const inviteLink = `https://pm.me/invite/${user?.username || 'me'}`;
  const qrRef = useRef<View>(null);
  const [alias, setAlias] = useState(user?.alias || '');
  const [originalUsername, setOriginalUsername] = useState(user?.username || '');
  const [originalBio, setOriginalBio] = useState(user?.bio || '');
  const [originalAlias, setOriginalAlias] = useState(user?.alias || '');

  React.useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getUser(user.id)
        .then(data => {
          setUsername(data.username || '');
          setBio(data.bio || '');
          setPhoto(data.photo || null);
          setAlias(data.alias || '');
          setOriginalUsername(data.username || '');
          setOriginalBio(data.bio || '');
          setOriginalAlias(data.alias || '');
        })
        .catch(() => setError('Failed to load user info'))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await updateUser(user.id, { username, bio, alias });
      setSuccess('Profile updated!');
      if (res.data) {
        setUsername(res.data.username);
        setBio(res.data.bio);
        setAlias(res.data.alias);
        updateUserContext(res.data); // Sync user context everywhere
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // use correct, non-deprecated API
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadingPhoto(true);
      setPhotoError('');
      
      try {
        const asset = result.assets[0];
        
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        // Use the original filename if available, otherwise generate a unique one
        const filename = asset.fileName || `profile_${Date.now()}.jpg`;
        
        if (!token) throw new Error('Not authenticated');
        
        const uploadRes = await uploadFile(blob, token, filename);
        const fileUrl = getFileUrl(uploadRes.filename); // Build the URL
        setPhoto(fileUrl);
        if (user?.id) {
          await updateUser(user.id, { avatar: JSON.stringify([uploadRes.filename]) }); // Save as JSON array
        }
      } catch (e: any) {
        setPhotoError(e.message || 'Failed to upload photo');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Copied!', 'Your invite link has been copied to the clipboard.');
  };

  const handleCopyQR = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Copied!', 'Your invite link has been copied to the clipboard.');
    } catch (e) {
      Alert.alert('Error', 'Failed to copy invite link.');
    }
  };

  const avatarFilename = Array.isArray(user?.avatar) && user.avatar.length > 0 ? user.avatar[0] : null;
  const photoUrl = avatarFilename ? getFileUrl(avatarFilename) : null;
  const defaultProfileImage = require('@/assets/images/default-contact-2.png');
  const isChanged = username !== originalUsername || bio !== originalBio || alias !== originalAlias;

  return (
    <ThemedView style={styles.container}>
      {/* Profile Photo */}
      <TouchableOpacity onPress={pickImage} style={styles.photoContainer} disabled={uploadingPhoto}>
        <Image
          source={photoUrl ? { uri: photoUrl } : defaultProfileImage}
          style={styles.photo}
        />
        <Text style={styles.changePhotoText}>{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</Text>
        {photoError ? <Text style={{ color: 'red', fontSize: 12 }}>{photoError}</Text> : null}
      </TouchableOpacity>
      {/* Username */}
      <View style={styles.inputRow}>
        <Text style={styles.atSign}>@</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          style={styles.usernameInput}
          autoCapitalize="none"
          placeholderTextColor={Colors.light.fontthird}
        />
      </View>
      {/* Alias */}
      <View style={styles.inputRow}>
        <Text style={styles.atSign}>#</Text>
        <TextInput
          value={alias}
          onChangeText={setAlias}
          placeholder="Display name (alias)"
          style={styles.usernameInput}
          autoCapitalize="none"
          placeholderTextColor={Colors.light.fontthird}
        />
      </View>
      {/* Bio */}
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Add a short bio (optional)"
        style={styles.bioInput}
        multiline
        maxLength={120}
        placeholderTextColor={Colors.light.fontthird}
      />
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      {success ? <Text style={{ color: 'green', marginBottom: 8 }}>{success}</Text> : null}
      {isChanged && (
        <TouchableOpacity onPress={handleSave} style={[styles.copyButton, { marginBottom: 12, marginTop: 8, alignSelf: 'center' }]} disabled={loading}>
          <Text style={styles.copyButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      )}
      {/* Invite Link & QR */}
      <View style={styles.inviteRow}>
        <Text style={styles.inviteLabel}>Invite Link:</Text>
        <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inviteLink}>{inviteLink}</Text>
      <TouchableOpacity onPress={() => setShowQR(true)} style={styles.qrButton}>
        <Text style={styles.qrButtonText}>Show QR Code</Text>
      </TouchableOpacity>
      {/* QR Code Modal */}
      <Modal
        visible={showQR}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.modalTitle}>Your Invite QR Code</Text>
              <View ref={qrRef} collapsable={false} style={{ alignItems: 'center', marginVertical: 24 }}>
                <QRCode value={inviteLink} size={220} />
              </View>
              <TouchableOpacity onPress={handleCopyQR} style={[styles.copyButton, { marginBottom: 12 }]}>
                <Text style={styles.copyButtonText}>Copy Link</Text>
              </TouchableOpacity>
              <Pressable onPress={() => setShowQR(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24 },
  photoContainer: { alignItems: 'center', marginBottom: 18, marginTop: 72 },
  photo: { width: 110, height: 110, borderRadius: 55, marginBottom: 8, backgroundColor: '#eee' },
  changePhotoText: { color: Colors.light.fontsemi, fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  atSign: { fontSize: 20, color: '#888', marginRight: 4 },
  usernameInput: { fontSize: 20, color: Colors.light.fontsemi, borderBottomWidth: 1, borderBottomColor: '#eee', flex: 1, paddingVertical: 4 },
  bioInput: { width: '100%', minHeight: 48, maxHeight: 80, borderWidth: 1, borderColor: '#999', borderRadius: 10, padding: 10, fontSize: 15, color: Colors.light.textbio, marginBottom: 18 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  inviteLabel: { fontSize: 15, color: '#888', marginRight: 8, textAlign:'center', justifyContent:'center', alignItems:'center' },
  copyButton: { backgroundColor: Colors.light.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, },
  copyButtonText: { color: '#fff', fontWeight: 'bold' },
  inviteLink: { color: Colors.light.textbio, fontSize: 14, marginTop: 6, marginBottom: 8, textAlign: 'center' },
  qrButton: { marginTop: 8, marginBottom: 8, backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  qrButtonText: { color: Colors.light.primary, fontWeight: 'bold' },
  qrContainer: { marginTop: 12, alignItems: 'center' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  closeModalButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  closeModalText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 