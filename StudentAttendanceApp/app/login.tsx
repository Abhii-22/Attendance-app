import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState } from './AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const { teachersList, setCurrentTeacher } = useAppGlobalState();
  
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Check if user email exists in database context record lists
    if (teachersList[cleanEmail]) {
      const record = teachersList[cleanEmail];
      
      // Pin validation check logic parameters matching execution block
      if (record.securityPin === cleanPin) {
        setCurrentTeacher(record.profile); // Set active session state global store parameters
        router.replace('/(tabs)');
        return;
      }
    }

    Alert.alert("Authentication Failed", "Invalid teacher email credentials or security pin combo.");
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
      />
      <TextInput 
        style={styles.input} 
        placeholder="Security Pin" 
        value={pin}
        onChangeText={setPin}
        secureTextEntry 
        keyboardType="numeric"
        placeholderTextColor="#A9A9A9" 
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Verify & Authorize Entry</Text>
      </TouchableOpacity>

      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>Demo Accounts Info:</Text>
        <Text style={styles.hintText}>• teacher1@university.edu (Pin: 1111)</Text>
        <Text style={styles.hintText}>• teacher2@university.edu (Pin: 2222)</Text>
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
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  hintBox: { marginTop: 30, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8 },
  hintTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 4 },
  hintText: { fontSize: 12, color: '#8E8E93' }
});