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

    // 🏫 CASE 2: LIVE DATABASE AUTHENTICATION WITH EXCLUSIVE TAB CROSS-LOGIN GUARD
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
        
        // Extract internal identifier strings safely to confirm identity type
        const profileRole = (accountProfile?.role || '').toLowerCase();
        const profileEmail = (accountProfile?.email || '').toLowerCase();
        const profileDept = (accountProfile?.department || '').toLowerCase();
        const profileDesig = (accountProfile?.designation || '').toLowerCase();

        // Check if this account has any Admin View markers attached to it
        const isActualAdminViewUser = 
          profileRole === 'adminview' ||
          profileDesig.includes('adminview') ||
          profileEmail.includes('admin') ||
          profileEmail.includes('view') ||
          profileDept.includes('admin') ||
          profileDesig.includes('admin');

        // 🛑 CROSS-LOGIN SAFEGUARD INTERCEPTORS:
        if (loginMode === 'teacher' && isActualAdminViewUser) {
          setIsLoading(false);
          Alert.alert(
            "Access Denied", 
            "This credential belongs to an Admin View account. Please use the 'Admin (View)' tab to log in."
          );
          return;
        }

        if (loginMode === 'adminview' && !isActualAdminViewUser) {
          setIsLoading(false);
          Alert.alert(
            "Access Denied", 
            "This credential belongs to a Faculty Teacher account. Please use the 'Teacher' tab to log in."
          );
          return;
        }

        // ✅ Authentication clear: Proceed to authorize the profile context
        if (typeof setCurrentTeacher === 'function') {
          setCurrentTeacher(accountProfile);
        }

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
      {/* Visual Header Block Container */}
      <View style={styles.brandHeroBlock}>
        <Text style={styles.logo}>🏫 Medini Technologies Attendance Portal</Text>
        <Text style={styles.subtext}>Select access tier mode below to unlock data directory</Text>
      </View>

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
          style={[styles.toggleTab, loginMode === 'adminview' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('adminview'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'adminview' && styles.activeToggleText]}>Admin (View)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleTab, loginMode === 'admin' && styles.activeToggleTab]} 
          onPress={() => { setLoginMode('admin'); setEmail(''); setPin(''); }}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, loginMode === 'admin' && styles.activeToggleText]}>Admin (Edit)</Text>
        </TouchableOpacity>
      </View>
      
      {/* TEXT FIELD ENTRY MODULE PANEL CARD */}
      <View style={styles.formPanelCard}>
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
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
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

      <Text style={styles.footerLegalText}>
        Powered by Medini Technology Group • Secure System Link
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 24 },
  brandHeroBlock: { alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', textAlign: 'center', letterSpacing: -0.5 },
  subtext: { fontSize: 13, color: '#8E8E93', fontWeight: '500', textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 14, padding: 3, marginBottom: 24, gap: 2 },
  toggleTab: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  activeToggleTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#636366' },
  activeToggleText: { color: '#007AFF', fontWeight: '700' },
  
  formPanelCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  input: { backgroundColor: '#F2F2F7', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: 14, marginBottom: 15, fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
  
  loginButton: { backgroundColor: '#007AFF', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  loginButtonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },

  footerLegalText: { textAlign: 'center', color: '#C7C7CC', fontSize: 11, fontWeight: '600', marginTop: 32, letterSpacing: 0.1 }
});