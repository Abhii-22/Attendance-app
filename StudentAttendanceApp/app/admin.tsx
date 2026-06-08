import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from './AppContext';
import { Ionicons } from '@expo/vector-icons';

interface TeacherItem {
  _id: string;
  name: string;
  email: string;
  department: string;
  employeeId: string;
  designation: string;
  securityPin: string;
}

export default function AdminScreen() {
  const router = useRouter();
  
  // Stats & Listing State
  const [stats, setStats] = useState({ totalTeachers: 0, totalStudents: 0, totalLogs: 0 });
  const [teachersList, setTeachersList] = useState<TeacherItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Form State (Create Mode)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(''); // ✅ Changed to free text input
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState(''); // ✅ Changed to free text input
  const [securityPin, setSecurityPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Editing States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState(''); // ✅ Changed to free text input
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDesignation, setEditDesignation] = useState(''); // ✅ Changed to free text input
  const [editSecurityPin, setEditSecurityPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Stats and Teachers together
  const loadDashboardData = async () => {
    try {
      const statsRes = await fetch(`${API_BASE_URL}/admin/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats({
          totalTeachers: statsData.totalTeachers,
          totalStudents: statsData.totalStudents,
          totalLogs: statsData.totalLogs
        });
      }

      const teachersRes = await fetch(`${API_BASE_URL}/admin/teachers`);
      const teachersData = await teachersRes.json();
      if (teachersData.success) {
        setTeachersList(teachersData.teachers);
      }
    } catch (error) {
      console.error("Failed to sync system database registries:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateTeacher = async () => {
    if (!name.trim() || !email.trim() || !employeeId.trim() || !securityPin.trim() || !department.trim() || !designation.trim()) {
      Alert.alert("Missing Fields", "Please complete all fields to register an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/teachers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          department: department.trim().toUpperCase(), // standardizes to upper case like CSE, AIML, etc.
          employeeId: employeeId.trim(),
          designation: designation.trim(),
          securityPin: securityPin.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("Success", `Account provisioned cleanly for ${name.trim()}!`);
        setName(''); setEmail(''); setEmployeeId(''); setSecurityPin(''); setDepartment(''); setDesignation('');
        loadDashboardData();
      } else {
        Alert.alert("Creation Failed", data.message || "Could not save profile.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not reach server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Dialog Panel
  const openEditModal = (item: TeacherItem) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditEmail(item.email);
    setEditDepartment(item.department);
    setEditEmployeeId(item.employeeId);
    setEditDesignation(item.designation);
    setEditSecurityPin(item.securityPin);
    setEditModalVisible(true);
  };

  const handleUpdateTeacher = async () => {
    if (!editingId) return;
    if (!editName.trim() || !editEmail.trim() || !editEmployeeId.trim() || !editSecurityPin.trim() || !editDepartment.trim() || !editDesignation.trim()) {
      Alert.alert("Missing Fields", "Please complete all fields before saving.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/teachers/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          department: editDepartment.trim().toUpperCase(),
          employeeId: editEmployeeId.trim(),
          designation: editDesignation.trim(),
          securityPin: editSecurityPin.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("Success", "Profile details updated successfully!");
        setEditModalVisible(false);
        setEditingId(null);
        loadDashboardData();
      } else {
        Alert.alert("Update Failed", data.message || "Could not update profile.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not update details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeacher = (id: string, teacherName: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you absolutely sure you want to delete ${teacherName}'s account access? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "🗑️ Delete Permanently", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, { method: 'DELETE' });
              const data = await response.json();
              if (response.ok && data.success) {
                Alert.alert("Deleted", "Profile removed from system index directory.");
                loadDashboardData();
              }
            } catch (error) {
              Alert.alert("Error", "Could not execute deletion request.");
            }
          }
        }
      ]
    );
  };

  // 🔍 REAL-TIME FILTER LOGIC
  const filteredTeachers = teachersList.filter((teacher) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      teacher.name.toLowerCase().includes(query) ||
      teacher.employeeId.toLowerCase().includes(query) ||
      teacher.department.toLowerCase().includes(query) ||
      teacher.designation.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login')}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          <Text style={styles.backBtnText}>Exit Terminal</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Central Administration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* METRICS SUMMARY DISPLAY */}
        <Text style={styles.sectionTitle}>System Metrics Overview</Text>
        {loadingData ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 15 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E0F0FF' }]}><Ionicons name="briefcase" size={20} color="#007AFF" /><Text style={styles.statNum}>{stats.totalTeachers}</Text><Text style={styles.statLabel}>Instructors</Text></View>
            <View style={[styles.statCard, { backgroundColor: '#E4F9E9' }]}><Ionicons name="people" size={20} color="#34C759" /><Text style={styles.statNum}>{stats.totalStudents}</Text><Text style={styles.statLabel}>Students</Text></View>
            <View style={[styles.statCard, { backgroundColor: '#F4E8FF' }]}><Ionicons name="cloud-upload" size={20} color="#AF52DE" /><Text style={styles.statNum}>{stats.totalLogs}</Text><Text style={styles.statLabel}>Attendance Logs</Text></View>
          </View>
        )}

        {/* REGISTRATION ENROLLMENT PANEL */}
        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Provision Instructor Credentials</Text>
          
          <TextInput style={styles.input} placeholder="Full Instructor Name" value={name} onChangeText={setName} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="University Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="Unique Employee / Instructor ID" value={employeeId} onChangeText={setEmployeeId} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="4-Digit Secure Entry PIN" value={securityPin} onChangeText={setSecurityPin} keyboardType="numeric" secureTextEntry maxLength={4} placeholderTextColor="#A9A9A9" />
          
          {/* ✅ New Text Input for Flexible Department Assignment */}
          <TextInput style={styles.input} placeholder="Department Assignment (e.g. Mechanical, CSE, Civil)" value={department} onChangeText={setDepartment} placeholderTextColor="#A9A9A9" />
          
          {/* ✅ New Text Input for Flexible Designations */}
          <TextInput style={styles.input} placeholder="Academic Rank / Designation (e.g. Senior Lecturer)" value={designation} onChangeText={setDesignation} placeholderTextColor="#A9A9A9" />

          <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.btnDisabled]} onPress={handleCreateTeacher} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🔐 Initialize Teacher Account</Text>}
          </TouchableOpacity>
        </View>

        {/* LIVE DIRECTORY WITH SEARCH FILTER BAR */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Registered Instructors List Directory</Text>
        
        {/* 🔍 SEARCH BAR ELEMENT BLOCK */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchBarInput}
            placeholder="Search by name, ID, rank, or department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {loadingData ? (
          <ActivityIndicator color="#007AFF" style={{ marginTop: 20 }} />
        ) : filteredTeachers.length === 0 ? (
          <Text style={styles.emptyText}>
            {teachersList.length === 0 ? "No records discovered." : "No matching instructor files found."}
          </Text>
        ) : (
          filteredTeachers.map((item) => (
            <View key={item._id} style={styles.teacherRowCard}>
              <View style={styles.teacherMetaInfo}>
                <Text style={styles.tName}>{item.name}</Text>
                <Text style={styles.tDetails}>{item.employeeId} • {item.designation}</Text>
                <Text style={styles.tSubDetails}>{item.email} | Dept: <Text style={{fontWeight: '700'}}>{item.department}</Text> | PIN: {item.securityPin}</Text>
              </View>
              
              <View style={styles.actionColButtons}>
                <TouchableOpacity style={styles.iconActionBtn} onPress={() => openEditModal(item)}>
                  <Ionicons name="pencil" size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDeleteTeacher(item._id, item.name)}>
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* REACT NATIVE EDIT PANEL MODAL PORTAL OVERLAY */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBlurWrapper}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitleHeader}>Modify Profile Record Parameters</Text>
            
            <TextInput style={styles.input} placeholder="Full Name" value={editName} onChangeText={setEditName} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Employee ID" value={editEmployeeId} onChangeText={setEditEmployeeId} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Security Entry PIN" value={editSecurityPin} onChangeText={setEditSecurityPin} keyboardType="numeric" maxLength={4} placeholderTextColor="#A9A9A9" />
            
            {/* ✅ Free Text Input inside Edit Modal */}
            <TextInput style={styles.input} placeholder="Department" value={editDepartment} onChangeText={setEditDepartment} placeholderTextColor="#A9A9A9" />
            
            {/* ✅ Free Text Input inside Edit Modal */}
            <TextInput style={styles.input} placeholder="Designation" value={editDesignation} onChangeText={setEditDesignation} placeholderTextColor="#A9A9A9" />

            <View style={styles.modalActionsRowButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Dismiss changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateTeacher}>
                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveText}>Save modifications</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  topNavbar: { height: 60, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  navTitle: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: '700', color: '#8E8E93' },
  container: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', minHeight: 90, justifyContent: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', marginTop: 4, color: '#1C1C1E' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '500' },
  formCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  formHeader: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 15 },
  input: { backgroundColor: '#F2F2F7', height: 44, borderRadius: 8, paddingHorizontal: 12, color: '#1C1C1E', fontSize: 14, marginBottom: 10 },
  submitBtn: { backgroundColor: '#34C759', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#A2E8B1' },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 25, fontSize: 14, fontStyle: 'italic' },
  
  // 🔍 Search Bar Layout Styling
  searchBarContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', paddingHorizontal: 10, height: 44, marginBottom: 15 },
  searchIcon: { marginRight: 8 },
  searchBarInput: { flex: 1, color: '#1C1C1E', fontSize: 14, height: '100%' },
  clearBtn: { padding: 4 },

  // Instructor Row Item layout styles
  teacherRowCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teacherMetaInfo: { flex: 1, paddingRight: 10 },
  tName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  tDetails: { fontSize: 12, color: '#3A3A3C', fontWeight: '600', marginTop: 2 },
  tSubDetails: { fontSize: 11, color: '#8E8E93', marginTop: 3 },
  actionColButtons: { flexDirection: 'row', gap: 8 },
  iconActionBtn: { width: 34, height: 34, backgroundColor: '#E0F0FF', borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  
  // Modal Styles
  modalBlurWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContentCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitleHeader: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 18, textAlign: 'center' },
  modalActionsRowButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#D1D1D6', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#555', fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { flex: 1, backgroundColor: '#007AFF', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontSize: 14, fontWeight: '600' }
});