import LogoSvg from '@/assets/images/logos/logo.svg';
import LogoSvg1 from '@/assets/images/logos/logo1.svg';
import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';

function isStrongPassword(password: string) {
  // At least 8 chars, one uppercase, one lowercase, one number, one special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

function checkPasswordRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

export default function AuthScreen() {
  const { login, register, registeredUsernames } = useAuth();
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = useState<'creator' | 'fan'>('fan');
  const [error, setError] = React.useState('');
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const screenWidth = Dimensions.get('window').width;

  // Theme-aware colors
  const primaryColor = colorScheme === 'light' ? Colors.light.primary : Colors.dark.primary;
  const inputBackgroundColor = colorScheme === 'light' ? '#fff' : '#2A2A2A';
  const inputBorderColor = colorScheme === 'light' ? '#8B8B8B' : '#555';
  const labelBackgroundColor = colorScheme === 'light' ? '#fff' : backgroundColor;
  const labelTextColor = colorScheme === 'light' ? '#8B8B8B' : '#CCC';
  const placeholderColor = colorScheme === 'light' ? '#bbb' : '#888';

  const requirements = checkPasswordRequirements(password);

  const handleAuth = async () => {
    setError('');
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
      return;
    }
    if (isLogin) {
      const ok = await login(username.trim(), password);
      if (!ok) setError('Invalid username or password');
    } else {
      const result = await register('', password, username.trim(), role);
      if (!result.ok) setError(result.error || 'Registration failed');
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* SVG Logos positioned at the top */}
      <View>
        <LogoSvg style={{ position: "absolute" }} />
        <LogoSvg1 style={{ position: "absolute" }} />
      </View>
      {/* Form Content */}
      <View style={{ flex: 1, width: '80%', marginLeft: "auto", marginRight: "auto", justifyContent: "flex-end", marginBottom: 120 }}>
        <ThemedText type="title" style={{ marginBottom: 24, marginLeft: "auto", marginRight: "auto" }}>{isLogin ? 'Login' : 'Register'}</ThemedText>
        {/* Username Field with Floating Label and Icon */}
        <View style={{ marginBottom: 18, width: 260, marginLeft: "auto", marginRight: "auto" }}>
          <View style={{
            position: 'absolute',
            top: -10,
            left: 16,
            backgroundColor: labelBackgroundColor,
            paddingHorizontal: 4,
            zIndex: 1,
            borderRadius:9999
          }}>
            <Text style={{ color: labelTextColor, fontSize: 14 }}>Username</Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: inputBorderColor,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: inputBackgroundColor,
          }}>
            <Feather name="user" size={20} color={labelTextColor} style={{ marginRight: 8 }} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={placeholderColor}
              style={{ flex: 1, fontSize: 16, color: textColor, paddingVertical: 0 }}
              autoCapitalize="none"
            />
          </View>
        </View>
        {/* Password Field with Floating Label and Icon */}
        <View style={{ marginBottom: 8, width: 260,marginLeft: "auto", marginRight: "auto" }}>
          <View style={{
            position: 'absolute',
            top: -16,
            left: 16,
            backgroundColor: labelBackgroundColor,
            padding: 4,
            zIndex: 1,
            borderRadius:9999
          }}>
            <Text style={{ color: labelTextColor, fontSize: 14 }}>Password</Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: inputBorderColor,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: inputBackgroundColor,
          }}>
            <Feather name="lock" size={20} color={labelTextColor} style={{ marginRight: 8 }} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={placeholderColor}
              style={{ flex: 1, fontSize: 16, color: textColor, paddingVertical: 0 }}
              secureTextEntry
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>
        </View>
        {/* Role Selector (only show on register) */}
        {!isLogin && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18 }}>
            <TouchableOpacity
              onPress={() => setRole('creator')}
              style={{
                backgroundColor: role === 'creator' ? primaryColor : '#eee',
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
                marginRight: 8,
              }}
            >
              <Text style={{ color: role === 'creator' ? '#fff' : '#333', fontWeight: 'bold' }}>Creator</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole('fan')}
              style={{
                backgroundColor: role === 'fan' ? primaryColor : '#eee',
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: role === 'fan' ? '#fff' : '#333', fontWeight: 'bold' }}>Fan</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Password requirements dialog */}
        {!isLogin && (passwordFocused || (!isStrongPassword(password) && password.length > 0)) && (
          <View style={{
            width: 260,
            backgroundColor: inputBackgroundColor,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: primaryColor,
          }}>
            <ThemedText style={{ marginBottom: 4, color: primaryColor, fontWeight: 'bold' }}>Password must contain:</ThemedText>
            <ThemedText style={{ color: requirements.length ? 'green' : 'red' }}>
              • At least 8 characters
            </ThemedText>
            <ThemedText style={{ color: requirements.uppercase ? 'green' : 'red' }}>
              • An uppercase letter
            </ThemedText>
            <ThemedText style={{ color: requirements.lowercase ? 'green' : 'red' }}>
              • A lowercase letter
            </ThemedText>
            <ThemedText style={{ color: requirements.number ? 'green' : 'red' }}>
              • A number
            </ThemedText>
            <ThemedText style={{ color: requirements.special ? 'green' : 'red' }}>
              • A special character
            </ThemedText>
          </View>
        )}
        {error ? <ThemedText style={{ color: 'red', marginBottom: 8 }}>{error}</ThemedText> : null}
        <TouchableOpacity onPress={handleAuth} style={{
          backgroundColor: primaryColor,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 32,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        >
          <Entypo name="login" size={24} color="white" style={{ marginRight: 4 }} />
          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{isLogin ? 'Login' : 'Register'}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginLeft: "auto", marginRight: "auto"}}>
          <ThemedText>
            {isLogin ? (
              <>
                No account? <ThemedText style={{ color: primaryColor }}>Register</ThemedText>
              </>
            ) : (
              <>
                Have an account? <ThemedText style={{ color: primaryColor }}>Login</ThemedText>
              </>
            )}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
} 