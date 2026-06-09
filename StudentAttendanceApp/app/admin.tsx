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

  // ACTIVE DIRECTORY TAB CONTROLLER
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
      setLoadingData(true);
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
      if (teachersData.success && Array.isArray(teachersData.teachers)) {
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

    let finalDesignation = designation.trim();

    // ✅ FIXED SAFEGUARD marker: If you are explicitly creating an Admin View account,
    // we attach an invisible space marker sequence "\u200B" combined with an "admin" identification token string 
    // to the end of the designation value. It will not change how it visibly looks on your screens,
    // but ensures the frontend engine catches it without changing your requested user input layout text!
    if (selectedRole === 'adminview') {
      finalDesignation = `${finalDesignation} \u200B(adminview)`;
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
          designation: finalDesignation,
          role: selectedRole,
          securityPin: securityPin.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("Success", `Account provisioned cleanly as ${selectedRole === 'teacher' ? 'Instructor' : 'Admin View Monitor'}!`);
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
    
    // Clean out fallback metadata marker token text if visible when updating details manually
    setEditDesignation(item.designation.replace(/\u200B\(adminview\)/g, '').trim());
    
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

    let finalDesignation = editDesignation.trim();
    if (editRole === 'adminview') {
      finalDesignation = `${finalDesignation} \u200B(adminview)`;
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
          designation: finalDesignation,
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

      // ✅ SEPARATION LOGIC CHECK ENGINE: Evaluates our custom un-spaced identification marker sequence tags 
      const isAdminView = 
        roleStr === 'adminview' || 
        desigStr.includes('adminview') ||
        emailStr.includes('admin') || 
        emailStr.includes('view') || 
        deptStr.includes('admin') ||
        desigStr.includes('admin') ||
        nameStr.includes('admin');

      if (isAdminView) {
        admins.push(item);
      } else {
        teachers.push(item);
      }
    });

    return { separatedTeachers: teachers, separatedAdmins: admins };
  }, [teachersList, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🏢 PROFILE HERO NAV HEADER BLOCK */}
      <View style={styles.profileHeroSection}>
        <View style={styles.heroLeft}>
          <Text style={styles.greetingSubtitle}>SYSTEM CONTROL</Text>
          <Text style={styles.greetingTitle}>Master Root Desk</Text>
          <View style={styles.departmentBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FF9500" style={{ marginRight: 4 }} />
            <Text style={styles.departmentBadgeText}>MASTER EDIT MODE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => router.replace('/login')}>
          <Ionicons name="log-out" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* SNAPSHOT SYSTEM METRICS */}
        <Text style={styles.sectionTitle}>System Metrics Overview</Text>
        {loadingData ? (
          <View style={styles.metricsLoadingWrapper}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.statsContainerStrip}>
            <View style={styles.statCardItem}>
              <View style={[styles.statIconBadge, { backgroundColor: '#E0F0FF' }]}>
                <Ionicons name="people" size={16} color="#007AFF" />
              </View>
              <Text style={styles.statCardNum}>{stats.totalTeachers}</Text>
              <Text style={styles.statCardLabel}>Total Accounts</Text>
            </View>
            
            <View style={styles.verticalDividerLine} />

            <View style={styles.statCardItem}>
              <View style={[styles.statIconBadge, { backgroundColor: '#E4F9E9' }]}>
                <Ionicons name="school" size={16} color="#34C759" />
              </View>
              <Text style={styles.statCardNum}>{stats.totalStudents}</Text>
              <Text style={styles.statCardLabel}>Enrolled Roster</Text>
            </View>

            <View style={styles.verticalDividerLine} />

            <View style={styles.statCardItem}>
              <View style={[styles.statIconBadge, { backgroundColor: '#F4E8FF' }]}>
                <Ionicons name="receipt" size={16} color="#AF52DE" />
              </View>
              <Text style={styles.statCardNum}>{stats.totalLogs}</Text>
              <Text style={styles.statCardLabel}>Logs Transmitted</Text>
            </View>
          </View>
        )}

        {/* PROVISION MANAGEMENT PROFILE FORM CARD */}
        <View style={styles.formPanelCard}>
          <Text style={styles.formHeaderTitleText}>Provision Account Workspace Tier</Text>

          {/* CREATION SELECTION INTERFACE CONTROLS */}
          <View style={styles.roleToggleTrackBar}>
            <TouchableOpacity 
              style={[styles.roleToggleTabItem, selectedRole === 'teacher' && styles.activeRoleToggleTabItem]}
              onPress={() => setSelectedRole('teacher')}
            >
              <Ionicons name="school" size={14} color={selectedRole === 'teacher' ? '#007AFF' : '#8E8E93'} style={{ marginRight: 4 }} />
              <Text style={[styles.roleToggleTextLabel, selectedRole === 'teacher' && styles.activeRoleToggleTextLabel]}>Teacher Role</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleToggleTabItem, selectedRole === 'adminview' && styles.activeRoleToggleTabItem]}
              onPress={() => setSelectedRole('adminview')}
            >
              <Ionicons name="eye" size={14} color={selectedRole === 'adminview' ? '#AF52DE' : '#8E8E93'} style={{ marginRight: 4 }} />
              <Text style={[styles.roleToggleTextLabel, selectedRole === 'adminview' && styles.activeRoleToggleTextLabel]}>Admin View</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.fieldLabelText}>Account Holder Name</Text>
          <TextInput style={styles.inputField} placeholder="e.g. Dr. Sarah Jenkins" value={name} onChangeText={setName} placeholderTextColor="#C7C7CC" />
          
          <Text style={styles.fieldLabelText}>Email Address</Text>
          <TextInput style={styles.inputField} placeholder="e.g. sarah@university.edu" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#C7C7CC" />
          
          <Text style={styles.fieldLabelText}>Account reference ID</Text>
          <TextInput style={styles.inputField} placeholder="e.g. EMP-2026-88" value={employeeId} onChangeText={setEmployeeId} placeholderTextColor="#C7C7CC" />
          
          <Text style={styles.fieldLabelText}>Secure entry PIN (4 Digits)</Text>
          <TextInput style={styles.inputField} placeholder="••••" value={securityPin} onChangeText={setSecurityPin} keyboardType="numeric" secureTextEntry maxLength={4} placeholderTextColor="#C7C7CC" />
          
          <Text style={styles.fieldLabelText}>Department Allocation</Text>
          <TextInput style={styles.inputField} placeholder="e.g. CSE, MECH, CIVIL" value={department} onChangeText={setDepartment} placeholderTextColor="#C7C7CC" />
          
          <Text style={styles.fieldLabelText}>Designation Rank Title</Text>
          <TextInput style={styles.inputField} placeholder="e.g. Dean Monitor" value={designation} onChangeText={setDesignation} placeholderTextColor="#C7C7CC" />

          <TouchableOpacity style={[styles.submitActionCTAButton, isSubmitting && styles.btnActionDisabled]} onPress={handleCreateTeacher} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitActionCTAText}>🔐 Initialize System Account Credentials</Text>}
          </TouchableOpacity>
        </View>

        {/* REGISTRY DIRECTORY WORKSPACE TITLES */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Accounts Catalog Index</Text>
        
        {/* GLOBAL TEXT FILTER CONNECTIONS */}
        <View style={styles.searchBarWrapperCard}>
          <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchInnerIcon} />
          <TextInput 
            style={styles.searchBarInputField}
            placeholder="Search accounts globally by name, ID or department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
            clearButtonMode="while-editing"
          />
        </View>

        {/* TARGET DIRECTORY SECTION TRACK TABS */}
        <View style={styles.directoryDirectoryTabBar}>
          <TouchableOpacity 
            style={[styles.directoryTabButton, activeDirectoryTab === 'faculty' && styles.activeDirectoryTabButton]}
            onPress={() => setActiveDirectoryTab('faculty')}
          >
            <Ionicons name="school" size={14} color={activeDirectoryTab === 'faculty' ? '#FFF' : '#8E8E93'} style={{ marginRight: 6 }} />
            <Text style={[styles.directoryTabText, activeDirectoryTab === 'faculty' && styles.activeDirectoryTabText]}>
              Faculty Teachers ({separatedTeachers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.directoryTabButton, activeDirectoryTab === 'adminview' && styles.activeDirectoryTabButton]}
            onPress={() => setActiveDirectoryTab('adminview')}
          >
            <Ionicons name="eye" size={14} color={activeDirectoryTab === 'adminview' ? '#FFF' : '#8E8E93'} style={{ marginRight: 6 }} />
            <Text style={[styles.directoryTabText, activeDirectoryTab === 'adminview' && styles.activeDirectoryTabText]}>
              Admin View ({separatedAdmins.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTAINER SHEETS DIRECTORY DISPATCH RENDERS */}
        <View style={styles.directoryMasterCardBlock}>
          {loadingData ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#007AFF" />
            </View>
          ) : activeDirectoryTab === 'faculty' ? (
            separatedTeachers.length === 0 ? (
              <Text style={styles.emptySectionText}>No registered faculty instructors correspond to this filter parameter.</Text>
            ) : (
              separatedTeachers.map((item) => (
                <View key={item._id} style={styles.teacherRowCard}>
                  <View style={styles.teacherMetaInfo}>
                    <Text style={styles.tName}>{item.name}</Text>
                    <Text style={styles.tDetails}>{item.employeeId} • {item.designation.replace(/\u200B\(adminview\)/g, '').trim()}</Text>
                    <Text style={styles.tSubDetails}>{item.email} | Dept: {item.department} | PIN: {item.securityPin}</Text>
                  </View>
                  <View style={styles.actionColButtons}>
                    <TouchableOpacity style={styles.iconActionBtn} onPress={() => openEditModal(item)}>
                      <Ionicons name="pencil" size={15} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDeleteTeacher(item._id, item.name)}>
                      <Ionicons name="trash" size={15} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          ) : (
            separatedAdmins.length === 0 ? (
              <Text style={styles.emptySectionText}>No administrative view profiles correspond to this filter parameter.</Text>
            ) : (
              separatedAdmins.map((item) => (
                <View key={item._id} style={[styles.teacherRowCard, { borderColor: '#E5D6F5' }]}>
                  <View style={styles.teacherMetaInfo}>
                    <Text style={styles.tName}>{item.name}</Text>
                    <Text style={styles.tDetails}>{item.employeeId} • {item.designation.replace(/\u200B\(adminview\)/g, '').trim()}</Text>
                    <Text style={styles.tSubDetails}>{item.email} | Dept: {item.department} | PIN: {item.securityPin}</Text>
                  </View>
                  <View style={styles.actionColButtons}>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#F4E8FF' }]} onPress={() => openEditModal(item)}>
                      <Ionicons name="pencil" size={15} color="#AF52DE" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDeleteTeacher(item._id, item.name)}>
                      <Ionicons name="trash" size={15} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )
          )}
        </View>

      </ScrollView>

      {/* PARAMETERS UPDATE MODAL POPUPS SHEET */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBlurOverlayWrapper}>
          <View style={styles.modalContentDisplayCardBox}>
            <Text style={styles.modalTitleHeaderTitleCaption}>Modify Profile Security Parameters</Text>

            <View style={[styles.roleToggleTrackBar, { marginBottom: 16 }]}>
              <TouchableOpacity style={[styles.roleToggleTabItem, editRole === 'teacher' && styles.activeRoleToggleTabItem]} onPress={() => setEditRole('teacher')}>
                <Text style={[styles.roleToggleTextLabel, editRole === 'teacher' && styles.activeRoleToggleTextLabel]}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleToggleTabItem, editRole === 'adminview' && styles.activeRoleToggleTabItem]} onPress={() => setEditRole('adminview')}>
                <Text style={[styles.roleToggleTextLabel, editRole === 'adminview' && styles.activeRoleToggleTextLabel]}>Admin View</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.fieldLabelText}>Full Name</Text>
            <TextInput style={styles.inputField} placeholder="Name" value={editName} onChangeText={setEditName} placeholderTextColor="#A9A9A9" />
            <Text style={styles.fieldLabelText}>Email Address</Text>
            <TextInput style={styles.inputField} placeholder="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#A9A9A9" />
            <Text style={styles.fieldLabelText}>Account Reference ID</Text>
            <TextInput style={styles.inputField} placeholder="Employee ID" value={editEmployeeId} onChangeText={setEditEmployeeId} placeholderTextColor="#A9A9A9" />
            <Text style={styles.fieldLabelText}>Security entry PIN</Text>
            <TextInput style={styles.inputField} placeholder="Security Pin" value={editSecurityPin} onChangeText={setEditSecurityPin} keyboardType="numeric" maxLength={4} placeholderTextColor="#A9A9A9" />
            <Text style={styles.fieldLabelText}>Department</Text>
            <TextInput style={styles.inputField} placeholder="Department" value={editDepartment} onChangeText={setEditDepartment} placeholderTextColor="#A9A9A9" />
            <Text style={styles.fieldLabelText}>Designation Rank</Text>
            <TextInput style={styles.inputField} placeholder="Designation" value={editDesignation} onChangeText={setEditDesignation} placeholderTextColor="#A9A9A9" />

            <View style={styles.modalActionButtonsInlineContainerRow}>
              <TouchableOpacity style={styles.modalCancelExecutionButtonCard} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelExecutionButtonCardTextLabel}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveCommitActionButtonCard} onPress={handleUpdateTeacher}>
                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSaveCommitActionButtonCardTextLabel}>Commit Changes</Text>}
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
  container: { padding: 16, paddingBottom: 40 },
  
  profileHeroSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginHorizontal: 16, marginTop: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  heroLeft: { flex: 1 },
  greetingSubtitle: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  greetingTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 2 },
  departmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFE5A3' },
  departmentBadgeText: { color: '#FF9500', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.8, paddingLeft: 2 },
  metricsLoadingWrapper: { height: 85, backgroundColor: '#FFFFFF', borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 20 },
  statsContainerStrip: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  statCardItem: { flex: 1, alignItems: 'center' },
  statIconBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statCardNum: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  statCardLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  verticalDividerLine: { width: 1, height: 44, backgroundColor: '#E5E5EA' },

  formPanelCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  formHeaderTitleText: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 14 },
  fieldLabelText: { fontSize: 11, fontWeight: '700', color: '#3A3A3C', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, paddingLeft: 2 },
  inputField: { backgroundColor: '#F2F2F7', height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: 12, color: '#1C1C1E', fontSize: 14, marginBottom: 12, fontWeight: '500' },
  
  roleToggleTrackBar: { flexDirection: 'row', backgroundColor: '#F2F2F7', padding: 3, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA', gap: 2 },
  roleToggleTabItem: { flex: 1, flexDirection: 'row', paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  activeRoleToggleTabItem: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 1, elevation: 1 },
  roleToggleTextLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  activeRoleToggleTextLabel: { color: '#1C1C1E', fontWeight: '700' },

  submitActionCTAButton: { backgroundColor: '#34C759', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 6, shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  btnActionDisabled: { opacity: 0.5 },
  submitActionCTAText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  searchBarWrapperCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', paddingHorizontal: 12, height: 44, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 1, elevation: 1 },
  searchInnerIcon: { marginRight: 8 },
  searchBarInputField: { flex: 1, color: '#1C1C1E', fontSize: 13, height: '100%', fontWeight: '500' },

  directoryDirectoryTabBar: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 3, marginBottom: 14, gap: 4 },
  directoryTabButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  activeDirectoryTabButton: { backgroundColor: '#007AFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  directoryTabText: { fontSize: 12, fontWeight: '600', color: '#636366' },
  activeDirectoryTabText: { color: '#FFFFFF', fontWeight: '700' },

  directoryMasterCardBlock: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  emptySectionText: { textAlign: 'center', color: '#8E8E93', fontSize: 13, fontStyle: 'italic', paddingVertical: 35, paddingHorizontal: 20 },
  teacherRowCard: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F2F2F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teacherMetaInfo: { flex: 1, paddingRight: 8 },
  tName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  tDetails: { fontSize: 12, color: '#3A3A3C', fontWeight: '600', marginTop: 1 },
  tSubDetails: { fontSize: 11, color: '#8E8E93', marginTop: 3 },
  actionColButtons: { flexDirection: 'row', gap: 6 },
  iconActionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F0FF' },

  modalBlurOverlayWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',  justifyContent: 'center', padding: 20 },
  modalContentDisplayCardBox: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  modalTitleHeaderTitleCaption: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', marginBottom: 16, textAlign: 'center' },
  modalActionButtonsInlineContainerRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancelExecutionButtonCard: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#D1D1D6', justifyContent: 'center', alignItems: 'center' },
  modalCancelExecutionButtonCardTextLabel: { color: '#48484A', fontSize: 13, fontWeight: '600' },
  modalSaveCommitActionButtonCard: { flex: 1, backgroundColor: '#007AFF', height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalSaveCommitActionButtonCardTextLabel: { color: '#FFF', fontSize: 13, fontWeight: '600' }
});