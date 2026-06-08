import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// ✅ Dynamically imports the network URL string to prevent configuration drift
import { useAppGlobalState, API_BASE_URL } from './AppContext';

const LOGIN_API_URL = `${API_BASE_URL}/auth/login`; 

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentTeacher } = useAppGlobalState();
  
  // 🎛️ Mode State: 'teacher' or 'admin'
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanEmail || !cleanPin) {
      Alert.alert("Missing Fields", "Please enter both email and PIN.");
      return;
    }

    setIsLoading(true);

    // 🔒 CASE 1: ADMINISTRATIVE TERMINAL VERIFICATION
    if (loginMode === 'admin') {
      setTimeout(() => {
        setIsLoading(false);
        // Secure hardcoded root administrative credentials
        if (cleanEmail === 'admin@university.edu' && cleanPin === '0000') {
          Alert.alert("Access Granted", "Administrative credentials verified successfully!");
          router.replace('/admin');
        } else {
          Alert.alert("Authentication Failed", "Invalid Master Administrative credentials.");
        }
      }, 800); // Small artificial delay for professional UX feedback
      return;
    }

    // 🏫 CASE 2: LIVE INSTRUCTOR MONGODB VERIFICATION
    try {
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, pin: cleanPin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentTeacher(data.profile); 
        router.replace('/(tabs)');
      } else {
        Alert.alert("Authentication Failed", data.message || "Invalid instructor credentials.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Network Error", "Could not connect to the server. Check your IP address and ensure your Node server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏫 University Portal</Text>
      <Text style={styles.subtext}>Select access tier mode below to unlock data directory</Text>

      {/* 🎛️ MODE SELECTOR TOGGLE SEGMENT */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'teacher' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('teacher'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'teacher' && styles.activeToggleText]}>Teacher Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'admin' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('admin'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'admin' && styles.activeToggleText]}>Admin Login</Text>
        </TouchableOpacity>
      </View>
      
      {/* EMAIL INPUT */}
      <TextInput 
        style={styles.input} 
        placeholder={loginMode === 'teacher' ? "Teacher Email ID" : "Admin Master Email"} 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#A9A9A9" 
        editable={!isLoading}
      />

      {/* PIN INPUT */}
      <TextInput 
        style={styles.input} 
        placeholder="Security Pin" 
        value={pin}
        onChangeText={setPin}
        secureTextEntry 
        keyboardType="numeric"
        placeholderTextColor="#A9A9A9" 
        editable={!isLoading}
      />

      {/* SUBMIT ACTION BUTTON */}
      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {loginMode === 'teacher' ? 'Verify & Authorize Entry' : 'Unlock Admin Workspace'}
          </Text>
        )}
      </TouchableOpacity>

      {/* HELP DYNAMIC ACCOUNT INFOTIP CONTAINER */}
      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>Available Test Access:</Text>
        {loginMode === 'teacher' ? (
          <Text style={styles.hintText}>• teacher1@university.edu (Pin: 1111)</Text>
        ) : (
          <Text style={styles.hintText}>• admin@university.edu (Pin: 0000)</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 5 },
  subtext: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 30 },
  
  // Toggle Tabs Style Setup
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4, marginBottom: 25 },
  toggleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeToggleTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  activeToggleText: { color: '#007AFF' },

  input: { backgroundColor: '#F2F2F7', height: 50, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 15, color: '#1C1C1E' },
  loginButton: { backgroundColor: '#007AFF', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonDisabled: { backgroundColor: '#78B8FF' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  hintBox: { marginTop: 30, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8 },
  hintTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 4 },
  hintText: { fontSize: 12, color: '#8E8E93' }
});