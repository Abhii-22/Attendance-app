import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState, API_BASE_URL } from './AppContext';

const LOGIN_API_URL = `${API_BASE_URL}/auth/login`; 

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentTeacher } = useAppGlobalState();
  
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin' | 'adminview'>('teacher');
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

    // 🔒 CASE 1: MASTER EDITABLE ROOT ADMIN GATEWAY
    if (loginMode === 'admin') {
      setTimeout(() => {
        setIsLoading(false);
        if (cleanEmail === 'pradeep@medini.in' && cleanPin === '2026') {
          Alert.alert("Access Granted", "Administrative credentials verified successfully!");
          router.replace('/admin');
        } else {
          Alert.alert("Authentication Failed", "Invalid Master Administrative credentials.");
        }
      }, 600); 
      return;
    }

    // 🏫 CASE 2: LIVE DATABASE AUTHENTICATION (TEACHERS AND ADMIN VIEWS)
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
        const accountProfile = data.profile || data.teacher || data.user;

        if (typeof setCurrentTeacher === 'function') {
          setCurrentTeacher(accountProfile);
        }

        // ✅ FIXED TAB-BASED ROUTING: Bypasses strict role checks entirely.
        // If they successfully authenticate on the Admin (View) tab, route straight to adminview.
        if (loginMode === 'adminview') {
          router.replace('/adminview');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert("Authentication Failed", data.message || "Invalid account credentials profile match.");
      }
    } catch (error) {
      console.error("Network Entry Verification Error:", error);
      Alert.alert("Network Error", "Could not reach the authentication servers.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏫 University Portal</Text>
      <Text style={styles.subtext}>Select access tier mode below to unlock data directory</Text>

      {/* THREE-WAY ACCESS LAYER SELECTION SEGMENTS */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'teacher' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('teacher'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'teacher' && styles.activeToggleText]}>Teacher</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'admin' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('admin'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'admin' && styles.activeToggleText]}>Admin (Edit)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'adminview' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('adminview'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'adminview' && styles.activeToggleText]}>Admin (View)</Text>
        </TouchableOpacity>
      </View>
      
      {/* TEXT FIELD ENTRY MODULE CARDS */}
      <TextInput 
        style={styles.input} 
        placeholder={
          loginMode === 'teacher' 
            ? "Faculty Email ID" 
            : loginMode === 'admin' 
            ? "Admin Master Email" 
            : "Admin View Monitor Email"
        } 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#A9A9A9" 
        editable={!isLoading}
      />

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

      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {loginMode === 'teacher' 
              ? 'Verify & Authorize Entry' 
              : loginMode === 'admin' 
              ? 'Unlock Admin Workspace' 
              : 'Launch Monitor View'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 5 },
  subtext: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 30 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4, marginBottom: 25, gap: 2 },
  toggleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeToggleTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  activeToggleText: { color: '#007AFF', fontWeight: '700' },
  input: { backgroundColor: '#F2F2F7', height: 50, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 15, color: '#1C1C1E' },
  loginButton: { backgroundColor: '#007AFF', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonDisabled: { backgroundColor: '#78B8FF' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});