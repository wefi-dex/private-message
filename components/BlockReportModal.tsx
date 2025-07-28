import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import Feather from '@expo/vector-icons/Feather';
import { blockUser, unblockUser, reportUser, checkIfBlocked } from '@/utils/api';
import { useAuth } from './AuthContext';

interface BlockReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    displayName: string;
    username?: string;
  };
  onBlockStatusChange?: (isBlocked: boolean) => void;
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Inappropriate content',
  'Spam or unwanted messages',
  'Fake account or impersonation',
  'Violence or threats',
  'Other'
];

export default function BlockReportModal({ 
  visible, 
  onClose, 
  targetUser, 
  onBlockStatusChange 
}: BlockReportModalProps) {
  const { user, token } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Check block status when modal opens
  React.useEffect(() => {
    if (visible && user && targetUser) {
      checkBlockStatus();
    }
  }, [visible, user, targetUser]);

  const checkBlockStatus = async () => {
    if (!user || !targetUser) return;
    try {
      const blockStatus = await checkIfBlocked(user.id, targetUser.id, token);
      setIsBlocked(blockStatus.blockedByMe);
    } catch (error) {
      console.error('Failed to check block status:', error);
    }
  };

  const handleBlock = async () => {
    if (!user || !targetUser) return;
    setLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(user.id, targetUser.id, token);
        setIsBlocked(false);
        onBlockStatusChange?.(false);
        Alert.alert('Success', `${targetUser.displayName} has been unblocked`);
      } else {
        await blockUser(user.id, targetUser.id, token);
        setIsBlocked(true);
        onBlockStatusChange?.(true);
        Alert.alert('Success', `${targetUser.displayName} has been blocked`);
      }
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update block status');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user || !targetUser || !selectedReason) return;
    setLoading(true);
    try {
      await reportUser(user.id, targetUser.id, selectedReason, description, token);
      Alert.alert('Success', 'User has been reported. Thank you for helping keep our community safe.');
      setShowReportForm(false);
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to report user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowReportForm(false);
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <ThemedView style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 20,
          padding: 24,
          maxHeight: '80%'
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <ThemedText style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {showReportForm ? 'Report User' : 'User Actions'}
            </ThemedText>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {!showReportForm ? (
            /* Block/Report Options */
            <View>
              <ThemedText style={{
                fontSize: 16,
                color: '#B7B3D7',
                marginBottom: 20,
                textAlign: 'center'
              }}>
                Actions for {targetUser.displayName}
              </ThemedText>

              {/* Block/Unblock Button */}
              <TouchableOpacity
                onPress={handleBlock}
                disabled={loading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  backgroundColor: isBlocked ? '#4CAF50' : '#FF5A5A',
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <Feather 
                  name={isBlocked ? "unlock" : "lock"} 
                  size={20} 
                  color="#fff" 
                  style={{ marginRight: 12 }}
                />
                <ThemedText style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </ThemedText>
              </TouchableOpacity>

              {/* Report Button */}
              <TouchableOpacity
                onPress={() => setShowReportForm(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  backgroundColor: '#FF9800',
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <Feather 
                  name="flag" 
                  size={20} 
                  color="#fff" 
                  style={{ marginRight: 12 }}
                />
                <ThemedText style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Report User
                </ThemedText>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  backgroundColor: 'transparent',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#B7B3D7'
                }}
              >
                <ThemedText style={{
                  color: '#B7B3D7',
                  fontSize: 16,
                  textAlign: 'center'
                }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            /* Report Form */
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={{
                fontSize: 16,
                color: '#B7B3D7',
                marginBottom: 20,
                textAlign: 'center'
              }}>
                Report {targetUser.displayName}
              </ThemedText>

              {/* Reason Selection */}
              <ThemedText style={{
                fontSize: 14,
                color: '#fff',
                marginBottom: 12,
                fontWeight: '600'
              }}>
                Reason for report:
              </ThemedText>
              
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: selectedReason === reason ? '#A259FF' : 'rgba(162,89,255,0.1)',
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedReason === reason ? '#A259FF' : 'transparent'
                  }}
                >
                  <ThemedText style={{
                    color: selectedReason === reason ? '#fff' : '#B7B3D7',
                    fontSize: 14
                  }}>
                    {reason}
                  </ThemedText>
                </TouchableOpacity>
              ))}

              {/* Description Input */}
              <ThemedText style={{
                fontSize: 14,
                color: '#fff',
                marginTop: 20,
                marginBottom: 12,
                fontWeight: '600'
              }}>
                Additional details (optional):
              </ThemedText>
              
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Provide more details about the issue..."
                placeholderTextColor="#B7B3D7"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: 'rgba(162,89,255,0.1)',
                  borderRadius: 8,
                  padding: 12,
                  color: '#fff',
                  fontSize: 14,
                  textAlignVertical: 'top',
                  minHeight: 80
                }}
              />

              {/* Action Buttons */}
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  onPress={handleReport}
                  disabled={loading || !selectedReason}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: !selectedReason ? '#666' : '#FF5A5A',
                    borderRadius: 12,
                    marginBottom: 12,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <ThemedText style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowReportForm(false)}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    backgroundColor: 'transparent',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#B7B3D7'
                  }}
                >
                  <ThemedText style={{
                    color: '#B7B3D7',
                    fontSize: 16,
                    textAlign: 'center'
                  }}>
                    Back
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
} 