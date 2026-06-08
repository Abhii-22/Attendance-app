import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// ✅ Dynamically imports the network URL string to prevent configuration drift
import { useAppGlobalState, API_BASE_URL } from './AppContext';

const LOGIN_API_URL = `${API_BASE_URL}/auth/login`; 

export default function LoginScreen() {
  const router = useRouter();
  const { setCurrentTeacher } = useAppGlobalState();
  
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
        Alert.alert("Authentication Failed", data.message || "Invalid credentials.");
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
      <Text style={styles.logo}>🏫 Instructor Terminal</Text>
      <Text style={styles.subtext}>Log in to manage your sections</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Teacher Email ID" 
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
          <Text style={styles.buttonText}>Verify & Authorize Entry</Text>
        )}
      </TouchableOpacity>

      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>Database Test Account:</Text>
        <Text style={styles.hintText}>• teacher1@university.edu (Pin: 1111)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 30 },
  logo: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 5 },
  subtext: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#F2F2F7', height: 50, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 15, color: '#1C1C1E' },
  loginButton: { backgroundColor: '#007AFF', height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonDisabled: { backgroundColor: '#78B8FF' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  hintBox: { marginTop: 30, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8 },
  hintTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 4 },
  hintText: { fontSize: 12, color: '#8E8E93' }
});