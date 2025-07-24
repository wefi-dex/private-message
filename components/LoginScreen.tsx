import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen({ onLogin, onRegister, onForgotPassword }: {
  onLogin?: (username: string, password: string) => void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim() || !password) {
      setError('Please enter your username and password');
      return;
    }
    setError('');
    onLogin?.(username.trim(), password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Private Message</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onForgotPassword} style={styles.linkWrapper}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onRegister}>
            <Text style={[styles.link, { marginLeft: 4 }]}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 32,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    marginBottom: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  linkWrapper: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  link: {
    color: '#0a7ea4',
    fontWeight: '500',
    fontSize: 15,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: '#888',
    fontSize: 15,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
}); 