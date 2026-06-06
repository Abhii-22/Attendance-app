import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppGlobalState } from '../AppContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTeacher, setCurrentTeacher, addNewStudent } = useAppGlobalState();
  
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [assignedClass, setAssignedClass] = useState('CSE A');

  // Fallback protection check handler routing blocks
  if (!currentTeacher) {
    return (
      <View style={styles.fallback}>
        <Text>No active supervisor profile session found.</Text>
      </View>
    );
  }

  const handleAddNewStudent = () => {
    if (!studentName.trim() || !rollNumber.trim()) {
      Alert.alert("Missing Fields", "Please complete all inputs parameters.");
      return;
    }
    addNewStudent(assignedClass, studentName.trim(), rollNumber.trim());
    Alert.alert("Success", `${studentName.trim()} added to roster section ${assignedClass}!`);
    setStudentName('');
    setRollNumber('');
  };

  const handleLogout = () => {
    setCurrentTeacher(null); // Clear context session identifiers block
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        {/* FIXED: Replaced HTML <div> with native React Native <View> Component */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {currentTeacher.name.split(' ').pop()?.substring(0,2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{currentTeacher.name}</Text>
        <Text style={styles.userEmail}>{currentTeacher.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}><Text style={styles.label}>Instructor ID:</Text><Text style={styles.val}>{currentTeacher.employeeId}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Department:</Text><Text style={styles.val}>{currentTeacher.department}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Designation:</Text><Text style={styles.val}>{currentTeacher.designation}</Text></View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formHeader}>Enroll New Student into Roster</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={studentName} onChangeText={setStudentName} placeholderTextColor="#A9A9A9" />
        <TextInput style={styles.input} placeholder="Roll Number" value={rollNumber} onChangeText={setRollNumber} placeholderTextColor="#A9A9A9" />

        <View style={styles.classPickerRow}>
          {['CSE A', 'CSE B', 'AIML', 'ECE'].map((cls) => (
            <TouchableOpacity key={cls} style={[styles.pickerChip, assignedClass === cls && styles.activeChip]} onPress={() => setAssignedClass(cls)}>
              <Text style={[styles.chipText, assignedClass === cls && styles.activeChipText]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitFormButton} onPress={handleAddNewStudent}>
          <Text style={styles.submitFormButtonText}>➕ Register New Student</Text>
        </TouchableOpacity>
      </View>

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
  classPickerRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D1D6' },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  activeChipText: { color: '#FFF' },
  submitFormButton: { backgroundColor: '#34C759', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitFormButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#FF3B30', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoutBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});