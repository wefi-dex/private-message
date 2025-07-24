import LogoSvg1 from '@/assets/images/logos/logo1.svg';
import { useAuth } from '@/components/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Feather from '@expo/vector-icons/Feather';
import React, { useState, memo } from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

function isStrongPassword(password: string) {
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

const AuthInput = memo(function AuthInput({ icon, value, onChangeText, placeholder, secureTextEntry, onFocus, onBlur, style, ...props }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused, style]}>
      <View style={styles.inputIconBg}>
        <Feather name={icon} size={20} color={focused ? '#fff' : '#7B2FF2'} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={focused ? '#fff' : '#B7B3D7'}
        style={styles.input}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        onFocus={e => { setFocused(true); onFocus && onFocus(e); }}
        onBlur={e => { setFocused(false); onBlur && onBlur(e); }}
        {...props}
      />
    </View>
  );
});
AuthInput.displayName = 'AuthInput';

const PasswordRequirements = memo(function PasswordRequirements({ password, visible }: { password: string; visible: boolean }) {
  const requirements = checkPasswordRequirements(password);
  if (!visible) return null;
  return (
    <View style={styles.passwordReqBox}>
      <ThemedText style={styles.passwordReqTitle}>Password must contain:</ThemedText>
      <ThemedText style={[styles.passwordReqItem, { color: requirements.length ? 'green' : 'red' }]}>• At least 8 characters</ThemedText>
      <ThemedText style={[styles.passwordReqItem, { color: requirements.uppercase ? 'green' : 'red' }]}>• An uppercase letter</ThemedText>
      <ThemedText style={[styles.passwordReqItem, { color: requirements.lowercase ? 'green' : 'red' }]}>• A lowercase letter</ThemedText>
      <ThemedText style={[styles.passwordReqItem, { color: requirements.number ? 'green' : 'red' }]}>• A number</ThemedText>
      <ThemedText style={[styles.passwordReqItem, { color: requirements.special ? 'green' : 'red' }]}>• A special character</ThemedText>
    </View>
  );
});
PasswordRequirements.displayName = 'PasswordRequirements';

const RoleSelector = memo(function RoleSelector({ role, setRole }: { role: 'creator' | 'fan'; setRole: (r: 'creator' | 'fan') => void }) {
  return (
    <View style={styles.roleSelectorWrap}>
      <TouchableOpacity
        onPress={() => setRole('creator')}
        style={[styles.roleBtn, role === 'creator' && styles.roleBtnActive]}
      >
        <Text style={[styles.roleBtnText, role === 'creator' && styles.roleBtnTextActive]}>Creator</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setRole('fan')}
        style={[styles.roleBtn, role === 'fan' && styles.roleBtnActive]}
      >
        <Text style={[styles.roleBtnText, role === 'fan' && styles.roleBtnTextActive]}>Fan</Text>
      </TouchableOpacity>
    </View>
  );
});
RoleSelector.displayName = 'RoleSelector';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [alias, setAlias] = React.useState('');
  const [role, setRole] = useState<'creator' | 'fan'>('fan');
  const [error, setError] = React.useState('');
  const [passwordFocused] = React.useState(false);
  // Theme-aware colors
  const handleAuth = async () => {
    setError('');
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!isLogin && !alias.trim()) {
      setError('Please enter your display name');
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
      const result = await register('', password, username.trim(), role, alias.trim());
      if (!result.ok) setError(result.error || 'Registration failed');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={["#23213A", "#2D2C5B", "#181828"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.logoWrap}>
        <LogoSvg1 style={styles.logoSvg1} />
      </View>
      <View style={[styles.formOuterWrap, !isLogin && { marginBottom: 52 }]}>
        <BlurView intensity={90} tint="dark" style={styles.blurView}>
          <View style={styles.formWrap}>
            <ThemedText type="title" style={styles.title}>{isLogin ? 'Login' : 'Register'}</ThemedText>
            <ThemedText style={styles.subtitle}>{isLogin ? 'Welcome back! Please login to your account.' : 'Create a new account to get started.'}</ThemedText>
            <AuthInput
              icon="at-sign"
              value={username}
              onChangeText={setUsername}
              placeholder="Username (required)"
              style={{ marginBottom: 18 }}
            />
            {!isLogin && (
              <AuthInput
                icon="user"
                value={alias}
                onChangeText={setAlias}
                placeholder="Display name (required)"
                style={{ marginBottom: 18 }}
              />
            )}
            <AuthInput
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 8 chars, A-Z, a-z, 0-9, symbol)"
              secureTextEntry
              style={{ marginBottom: 8 }}
            />
            {!isLogin && <RoleSelector role={role} setRole={setRole} />}
            <PasswordRequirements password={password} visible={!isLogin && (passwordFocused || (!isStrongPassword(password) && password.length > 0))} />
            {error ? <View style={styles.errorBox}><ThemedText style={styles.error}>{error}</ThemedText></View> : null}
            <TouchableOpacity onPress={handleAuth} style={styles.authBtn} activeOpacity={0.92}>
              <LinearGradient
                colors={["#A259FF", "#6B47DC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.authBtnGradient}
              >
                <Feather name="arrow-right" size={28} color="#fff" style={{ marginRight: 12 }} />
                <ThemedText style={styles.authBtnText}>{isLogin ? 'Login' : 'Register'}</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn} activeOpacity={0.7}>
              <ThemedText style={styles.switchText}>
                {isLogin ? (
                  <>
                    No account? <ThemedText style={styles.switchLink}>Register</ThemedText>
                  </>
                ) : (
                  <>
                    Have an account? <ThemedText style={styles.switchLink}>Login</ThemedText>
                  </>
                )}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181828',
  },
  logoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    height: 120,
    justifyContent: 'center',
  },
  logoSvg: {
    width: 120,
    height: 60,
    marginTop: 32,
  },
  logoSvg1: {
    width: 80,
    height: 40,
    marginTop: 12,
  },
  formOuterWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 40,
  },
  blurView: {
    width: '92%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(35,33,58,0.96)',
    borderWidth: 2,
    borderColor: '#7B2FF2',
    alignSelf: 'center',
    shadowColor: '#8F5CFF',
    shadowOpacity: 0.32,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  formWrap: {
    width: '100%',
    padding: 36,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'rgba(24,24,40,0.97)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#23213A',
    shadowColor: '#7B2FF2',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  title: {
    marginBottom: 12,
    alignSelf: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.2,
    textShadowColor: '#23213A',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: '#B7B3D7',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#35345A',
    borderRadius: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(44,44,68,0.98)',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIconBg: {
    backgroundColor: '#23213A',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#35345A',
  },
  inputWrapFocused: {
    borderColor: '#8F5CFF',
    backgroundColor: 'rgba(44,44,68,1)',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: 'rgba(255,56,96,0.13)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  error: {
    color: '#FF3860',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  authBtn: {
    borderRadius: 24,
    marginTop: 18,
    marginBottom: 24,
    overflow: 'hidden',
  },
  authBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: '#A259FF',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  authBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
    textShadowColor: '#23213A',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(123,47,242,0.22)',
    marginVertical: 18,
    borderRadius: 2,
  },
  switchBtn: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchText: {
    color: '#B7B3D7',
    fontSize: 16,
    fontWeight: '500',
  },
  switchLink: {
    color: '#8F5CFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  passwordReqBox: {
    width: '100%',
    backgroundColor: '#23213A',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#7B2FF2',
    alignSelf: 'center',
  },
  passwordReqTitle: {
    marginBottom: 4,
    color: '#7B2FF2',
    fontWeight: 'bold',
  },
  passwordReqItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  roleSelectorWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 2,
    gap: 8,
  },
  roleBtn: {
    backgroundColor: '#35345A',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: '#7B2FF2',
    borderColor: '#7B2FF2',
  },
  roleBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
}); 