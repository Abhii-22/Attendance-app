import React, { useState, useEffect, useMemo } from 'react';
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
  role?: 'teacher' | 'adminview';
}

type DirectoryViewTab = 'faculty' | 'adminview';

export default function AdminScreen() {
  const router = useRouter();
  
  // Stats & Listing State
  const [stats, setStats] = useState({ totalTeachers: 0, totalStudents: 0, totalLogs: 0 });
  const [teachersList, setTeachersList] = useState<TeacherItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ ACTIVE DIRECTORY TAB CONTROLLER
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<DirectoryViewTab>('faculty');

  // Form State (Create Mode)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(''); 
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState(''); 
  const [securityPin, setSecurityPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'adminview'>('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Editing States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState(''); 
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDesignation, setEditDesignation] = useState(''); 
  const [editSecurityPin, setEditSecurityPin] = useState('');
  const [editRole, setEditRole] = useState<'teacher' | 'adminview'>('teacher');
  const [isUpdating, setIsUpdating] = useState(false);

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
          department: department.trim().toUpperCase(), 
          employeeId: employeeId.trim(),
          designation: designation.trim(),
          securityPin: securityPin.trim(),
          role: selectedRole
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("Success", `Account provisioned cleanly as ${selectedRole === 'teacher' ? 'Instructor' : 'Admin View Monitor'}!`);
        // Force list switch to see newly created account instantly
        setActiveDirectoryTab(selectedRole === 'teacher' ? 'faculty' : 'adminview');
        
        setName(''); setEmail(''); setEmployeeId(''); setSecurityPin(''); setDepartment(''); setDesignation('');
        setSelectedRole('teacher');
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

  const openEditModal = (item: TeacherItem) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditEmail(item.email);
    setEditDepartment(item.department);
    setEditEmployeeId(item.employeeId);
    setEditDesignation(item.designation);
    setEditSecurityPin(item.securityPin);
    setEditRole(item.role || 'teacher');
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
          securityPin: editSecurityPin.trim(),
          role: editRole
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
      `Are you absolutely sure you want to delete ${teacherName}'s profile access?`,
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
                Alert.alert("Deleted", "Profile removed from system directory index.");
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

  // ✅ ULTRA-AGGRESSIVE FILTERING LOOP FOR DUAL LIST MANAGEMENT
  const { separatedTeachers, separatedAdmins } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = teachersList.filter((item) => 
      item.name.toLowerCase().includes(query) ||
      item.employeeId.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    );

    const admins: TeacherItem[] = [];
    const teachers: TeacherItem[] = [];

    filtered.forEach(item => {
      const nameStr = (item.name || '').toLowerCase();
      const emailStr = (item.email || '').toLowerCase();
      const deptStr = (item.department || '').toLowerCase();
      const desigStr = (item.designation || '').toLowerCase();
      const roleStr = (item.role || '').toLowerCase();

      if (
        roleStr === 'adminview' || 
        emailStr.includes('admin') || 
        emailStr.includes('view') || 
        deptStr.includes('admin') ||
        desigStr.includes('admin') ||
        nameStr.includes('admin')
      ) {
        admins.push(item);
      } else {
        teachers.push(item);
      }
    });

    return { separatedTeachers: teachers, separatedAdmins: admins };
  }, [teachersList, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login')}>
          <Ionicons name="arrow-back" size={22} color="#1C1C1E" />
          <Text style={styles.backBtnText}>Exit Terminal</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Control Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* METRICS DISPLAYS */}
        <Text style={styles.sectionTitle}>System Metrics Overview</Text>
        {loadingData ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 15 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E0F0FF' }]}><Ionicons name="briefcase" size={18} color="#007AFF" /><Text style={styles.statNum}>{stats.totalTeachers}</Text><Text style={styles.statLabel}>Total Staff</Text></View>
            <View style={[styles.statCard, { backgroundColor: '#E4F9E9' }]}><Ionicons name="people" size={18} color="#34C759" /><Text style={styles.statNum}>{stats.totalStudents}</Text><Text style={styles.statLabel}>Students</Text></View>
            <View style={[styles.statCard, { backgroundColor: '#F4E8FF' }]}><Ionicons name="cloud-upload" size={18} color="#AF52DE" /><Text style={styles.statNum}>{stats.totalLogs}</Text><Text style={styles.statLabel}>Logs Sent</Text></View>
          </View>
        )}

        {/* REGISTRATION ENROLLMENT PANEL */}
        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Provision Account Access Tier</Text>

          {/* ROLE SELECTION TOGGLE BUTTONS */}
          <View style={styles.roleToggleContainer}>
            <TouchableOpacity 
              style={[styles.roleToggleTab, selectedRole === 'teacher' && styles.activeRoleToggleTab]}
              onPress={() => setSelectedRole('teacher')}
            >
              <Text style={[styles.roleToggleText, selectedRole === 'teacher' && styles.activeRoleToggleText]}>Teacher Role</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleToggleTab, selectedRole === 'adminview' && styles.activeRoleToggleTab]}
              onPress={() => setSelectedRole('adminview')}
            >
              <Text style={[styles.roleToggleText, selectedRole === 'adminview' && styles.activeRoleToggleText]}>Admin (View)</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput style={styles.input} placeholder="Account Holder Name" value={name} onChangeText={setName} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="Unique Employee / Account ID" value={employeeId} onChangeText={setEmployeeId} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="4-Digit Secure Entry PIN" value={securityPin} onChangeText={setSecurityPin} keyboardType="numeric" secureTextEntry maxLength={4} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="Department (e.g. CSE, ADMIN, ECE)" value={department} onChangeText={setDepartment} placeholderTextColor="#A9A9A9" />
          <TextInput style={styles.input} placeholder="Academic Designation / Rank" value={designation} onChangeText={setDesignation} placeholderTextColor="#A9A9A9" />

          <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.btnDisabled]} onPress={handleCreateTeacher} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>🔐 Initialize Account Credentials</Text>}
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR INPUT */}
        <View style={[styles.searchBarContainer, { marginTop: 25, marginBottom: 10 }]}>
          <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchBarInput}
            placeholder="Search active directory registries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
            clearButtonMode="while-editing"
          />
        </View>

        {/* ================= ✅ NEW USER FRIENDLY TAB VIEW TOGGLE BREAKDOWNS ================= */}
        <View style={styles.directorySegmentBar}>
          <TouchableOpacity 
            style={[styles.segmentTab, activeDirectoryTab === 'faculty' && styles.activeSegmentTab]}
            onPress={() => setActiveDirectoryTab('faculty')}
          >
            <Ionicons name="school" size={14} color={activeDirectoryTab === 'faculty' ? '#FFF' : '#8E8E93'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentTabText, activeDirectoryTab === 'faculty' && styles.activeSegmentTabText]}>
              Faculty Teachers ({separatedTeachers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.segmentTab, activeDirectoryTab === 'adminview' && styles.activeSegmentTab]}
            onPress={() => setActiveDirectoryTab('adminview')}
          >
            <Ionicons name="eye" size={14} color={activeDirectoryTab === 'adminview' ? '#FFF' : '#8E8E93'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentTabText, activeDirectoryTab === 'adminview' && styles.activeSegmentTabText]}>
              Admin View ({separatedAdmins.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* DIRECTORY DISPLAY ZONE */}
        <View style={styles.directoryBlock}>
          {loadingData ? (
            <ActivityIndicator color="#007AFF" style={{ marginVertical: 30 }} />
          ) : activeDirectoryTab === 'faculty' ? (
            /* 📂 CONDITIONAL MODULE A: SHOW TEACHERS ONLY */
            separatedTeachers.length === 0 ? (
              <Text style={styles.emptySectionText}>No teacher listings found matching query criteria.</Text>
            ) : (
              separatedTeachers.map((item) => (
                <View key={item._id} style={styles.teacherRowCard}>
                  <View style={styles.teacherMetaInfo}>
                    <Text style={styles.tName}>{item.name}</Text>
                    <Text style={styles.tDetails}>{item.employeeId} • {item.designation}</Text>
                    <Text style={styles.tSubDetails}>{item.email} | Dept: {item.department} | PIN: {item.securityPin}</Text>
                  </View>
                  <View style={styles.actionColButtons}>
                    <TouchableOpacity style={styles.iconActionBtn} onPress={() => openEditModal(item)}>
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDeleteTeacher(item._id, item.name)}>
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            /* 📂 CONDITIONAL MODULE B: SHOW ADMIN VIEW ONLY */
            separatedAdmins.length === 0 ? (
              <Text style={styles.emptySectionText}>No admin view accounts found matching query criteria.</Text>
            ) : (
              separatedAdmins.map((item) => (
                <View key={item._id} style={[styles.teacherRowCard, { borderColor: '#E5D6F5' }]}>
                  <View style={styles.teacherMetaInfo}>
                    <Text style={styles.tName}>{item.name}</Text>
                    <Text style={styles.tDetails}>{item.employeeId} • {item.designation}</Text>
                    <Text style={styles.tSubDetails}>{item.email} | Dept: {item.department} | PIN: {item.securityPin}</Text>
                  </View>
                  <View style={styles.actionColButtons}>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#F4E8FF' }]} onPress={() => openEditModal(item)}>
                      <Ionicons name="pencil" size={16} color="#AF52DE" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDeleteTeacher(item._id, item.name)}>
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          )}
        </View>

      </ScrollView>

      {/* PARAMETER MODIFICATION MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBlurWrapper}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitleHeader}>Modify Profile Access Parameters</Text>

            <View style={[styles.roleToggleContainer, { marginBottom: 15 }]}>
              <TouchableOpacity style={[styles.roleToggleTab, editRole === 'teacher' && styles.activeRoleToggleTab]} onPress={() => setEditRole('teacher')}>
                <Text style={[styles.roleToggleText, editRole === 'teacher' && styles.activeRoleToggleText]}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleToggleTab, editRole === 'adminview' && styles.activeRoleToggleTab]} onPress={() => setEditRole('adminview')}>
                <Text style={[styles.roleToggleText, editRole === 'adminview' && styles.activeRoleToggleText]}>Admin View</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput style={styles.input} placeholder="Full Name" value={editName} onChangeText={setEditName} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Employee ID" value={editEmployeeId} onChangeText={setEditEmployeeId} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Security Pin" value={editSecurityPin} onChangeText={setEditSecurityPin} keyboardType="numeric" maxLength={4} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Department" value={editDepartment} onChangeText={setEditDepartment} placeholderTextColor="#A9A9A9" />
            <TextInput style={styles.input} placeholder="Designation" value={editDesignation} onChangeText={setEditDesignation} placeholderTextColor="#A9A9A9" />

            <View style={styles.modalActionsRowButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateTeacher}>
                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveText}>Save Changes</Text>}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  navTitle: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '700', color: '#8E8E93' },
  container: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', minHeight: 85, justifyContent: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', marginTop: 2, color: '#1C1C1E' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '600', textAlign: 'center' },
  formCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  formHeader: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  input: { backgroundColor: '#F2F2F7', height: 44, borderRadius: 8, paddingHorizontal: 12, color: '#1C1C1E', fontSize: 14, marginBottom: 10 },
  submitBtn: { backgroundColor: '#34C759', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  btnDisabled: { backgroundColor: '#A2E8B1' },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  // Create Access Tier Roles selector layout
  roleToggleContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', padding: 3, borderRadius: 8, marginBottom: 12 },
  roleToggleTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeRoleToggleTab: { backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  roleToggleText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  activeRoleToggleText: { color: '#007AFF', fontWeight: '700' },

  // Search Roster components
  searchBarContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchBarInput: { flex: 1, color: '#1C1C1E', fontSize: 14, height: '100%', fontWeight: '500' },

  // ✅ NEW USER FRIENDLY TAB VIEW SWITCH TRACKS:
  directorySegmentBar: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 3, marginBottom: 12, gap: 4 },
  segmentTab: { flex: 1, flexDirection: 'row', paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  activeSegmentTab: { backgroundColor: '#007AFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  segmentTabText: { fontSize: 12, fontWeight: '600', color: '#636366' },
  activeSegmentTabText: { color: '#FFFFFF', fontWeight: '700' },

  // Directory block rows container layout setup
  directoryBlock: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  emptySectionText: { textAlign: 'center', color: '#8E8E93', fontSize: 13, fontStyle: 'italic', paddingVertical: 35, paddingHorizontal: 20 },

  teacherRowCard: { backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F2F2F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teacherMetaInfo: { flex: 1, paddingRight: 8 },
  tName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  tDetails: { fontSize: 12, color: '#3A3A3C', fontWeight: '600', marginTop: 1 },
  tSubDetails: { fontSize: 11, color: '#8E8E93', marginTop: 3 },
  actionColButtons: { flexDirection: 'row', gap: 6 },
  iconActionBtn: { width: 34, height: 34, backgroundColor: '#E0F0FF', borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  modalBlurWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContentCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitleHeader: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 16, textAlign: 'center' },
  modalActionsRowButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#D1D1D6', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#555', fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { flex: 1, backgroundColor: '#007AFF', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSaveText: { color: '#FFF', fontSize: 14, fontWeight: '600' }
});