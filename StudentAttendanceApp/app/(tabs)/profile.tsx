import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAppGlobalState } from '../AppContext';
import { useRouter } from 'expo-router';

// ⚠️ Uses your computer's local IP address
const ENROLL_API_URL = 'http://192.168.1.10:5000/api/students/enroll';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTeacher, setCurrentTeacher, addNewStudent } = useAppGlobalState();
  
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [assignedClass, setAssignedClass] = useState('CSE A');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fallback protection check
  if (!currentTeacher) {
    return (
      <View style={styles.fallback}>
        <Text>No active supervisor profile session found.</Text>
      </View>
    );
  }

  const handleAddNewStudent = async () => {
    if (!studentName.trim() || !rollNumber.trim()) {
      Alert.alert("Missing Fields", "Please enter both the Student Name and Roll Number.");
      return;
    }

    setIsEnrolling(true);

    try {
      // Send real data to your MongoDB backend
      const response = await fetch(ENROLL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName.trim(),
          rollNumber: rollNumber.trim(),
          assignedClass: assignedClass,
          teacherId: currentTeacher.id // Attach the logged-in teacher's ID
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state so the student appears instantly without a refresh
        addNewStudent(assignedClass, studentName.trim(), rollNumber.trim());
        
        Alert.alert("Database Success", `${studentName.trim()} has been permanently saved to the ${assignedClass} roster in MongoDB!`);
        
        // Clear inputs after success
        setStudentName('');
        setRollNumber('');
      } else {
        // Backend returned an error (e.g., Roll Number already exists)
        Alert.alert("Enrollment Failed", data.message || "Could not register student.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Network Error", "Could not reach the server. Ensure your backend is running.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleLogout = () => {
    setCurrentTeacher(null); 
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Teacher Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {currentTeacher.name.split(' ').pop()?.substring(0,2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{currentTeacher.name}</Text>
        <Text style={styles.userEmail}>{currentTeacher.email}</Text>
      </View>

      {/* Teacher Corporate Details */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}><Text style={styles.label}>Instructor ID:</Text><Text style={styles.val}>{currentTeacher.employeeId}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Department:</Text><Text style={styles.val}>{currentTeacher.department}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Designation:</Text><Text style={styles.val}>{currentTeacher.designation}</Text></View>
      </View>

      {/* Database Registration Form */}
      <View style={styles.formCard}>
        <Text style={styles.formHeader}>Enroll New Student into Database</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Full Student Name" 
          value={studentName} 
          onChangeText={setStudentName} 
          placeholderTextColor="#A9A9A9" 
          editable={!isEnrolling}
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Roll Number (Must be Unique)" 
          value={rollNumber} 
          onChangeText={setRollNumber} 
          placeholderTextColor="#A9A9A9" 
          editable={!isEnrolling}
        />

        <View style={styles.classPickerRow}>
          {['CSE A', 'CSE B', 'AIML', 'ECE'].map((cls) => (
            <TouchableOpacity 
              key={cls} 
              style={[styles.pickerChip, assignedClass === cls && styles.activeChip]} 
              onPress={() => setAssignedClass(cls)}
              disabled={isEnrolling}
            >
              <Text style={[styles.chipText, assignedClass === cls && styles.activeChipText]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitFormButton, isEnrolling && styles.submitFormButtonDisabled]} 
          onPress={handleAddNewStudent}
          disabled={isEnrolling}
        >
          {isEnrolling ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitFormButtonText}>➕ Register to MongoDB</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Disconnect Session Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F2F2F7', padding: 20 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginVertical: 15 },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  userEmail: { fontSize: 14, color: '#8E8E93', marginTop: 3 },
  infoSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 25, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  label: { color: '#8E8E93', fontSize: 14 },
  val: { color: '#1C1C1E', fontWeight: '600', fontSize: 14 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 2, marginBottom: 20 },
  formHeader: { fontSize: 15, fontWeight: '700', color: '#3A3A3C', marginBottom: 15 },
  input: { backgroundColor: '#F2F2F7', height: 46, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, color: '#1C1C1E' },
  classPickerRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D1D6' },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  activeChipText: { color: '#FFF' },
  submitFormButton: { backgroundColor: '#34C759', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitFormButtonDisabled: { backgroundColor: '#A2E8B1' },
  submitFormButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#FF3B30', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoutBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});