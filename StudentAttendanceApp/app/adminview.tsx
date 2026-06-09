import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState, API_BASE_URL } from './AppContext';
import { Ionicons } from '@expo/vector-icons';

type ViewTab = 'attendance' | 'students' | 'faculty';

export default function AdminViewDashboard() {
  const router = useRouter();
  const { setCurrentTeacher } = useAppGlobalState();

  const [activeTab, setActiveTab] = useState<ViewTab>('attendance');
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // 🔍 SEARCH FILTER STATES
  const [attendanceQuery, setAttendanceQuery] = useState('');
  const [studentsQuery, setStudentsQuery] = useState('');
  const [facultyQuery, setFacultyQuery] = useState('');

  // Read-Only Global State Collections
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [globalStudents, setGlobalStudents] = useState<any[]>([]);
  const [globalTeachers, setGlobalTeachers] = useState<any[]>([]);

  // FETCH DATA BY AGGREGATING MULTI-TEACHER TARGET RECORDS
  const fetchAllSystemMasterData = async () => {
    try {
      setLoading(true);

      const teachRes = await fetch(`${API_BASE_URL}/admin/teachers`);
      const teachData = await teachRes.json();

      let instructors: any[] = [];
      if (teachData.success && Array.isArray(teachData.teachers)) {
        instructors = teachData.teachers;
        setGlobalTeachers(teachData.teachers);
      }

      if (instructors.length === 0) {
        setLoading(false);
        return;
      }

      const logPromises = instructors.map(t => 
        fetch(`${API_BASE_URL}/history/${t._id}`).then(res => res.json()).catch(() => ({ success: false }))
      );
      const studentPromises = instructors.map(t => 
        fetch(`${API_BASE_URL}/students/teacher/${t._id}`).then(res => res.json()).catch(() => ({ success: false }))
      );

      const logResults = await Promise.all(logPromises);
      const studentResults = await Promise.all(studentPromises);

      let aggregatedLogs: any[] = [];
      logResults.forEach(res => {
        if (res.success && Array.isArray(res.logs)) {
          aggregatedLogs = [...aggregatedLogs, ...res.logs];
        }
      });
      setGlobalLogs(aggregatedLogs);

      let aggregatedStudents: any[] = [];
      const duplicateFilterSet = new Set();

      studentResults.forEach(res => {
        if (res.success && Array.isArray(res.students)) {
          res.students.forEach((student: any) => {
            const uniqueKey = `${student.name}-${student.rollNumber}`;
            if (!duplicateFilterSet.has(uniqueKey)) {
              duplicateFilterSet.add(uniqueKey);
              aggregatedStudents.push(student);
            }
          });
        }
      });
      setGlobalStudents(aggregatedStudents);

    } catch (err) {
      console.error("Master dashboard data aggregation failed:", err);
      Alert.alert("Sync Notice", "Data refreshing dynamically from database background clusters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSystemMasterData();
  }, []);

  const toggleLogExpansion = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  // ✅ 1. FILTERED & CHRONOLOGICAL LOG GROUPING (ATTENDANCE)
  const filteredGroupedHistoryLogs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (Array.isArray(globalLogs)) {
      const query = attendanceQuery.toLowerCase().trim();
      
      const filtered = globalLogs.filter(log => 
        (log.className || '').toLowerCase().includes(query) ||
        (log.teacherName || '').toLowerCase().includes(query) ||
        (log.dateString || '').toLowerCase().includes(query)
      );

      const sortedLogs = [...filtered].sort((a, b) => (b.dateString || '').localeCompare(a.dateString || ''));
      sortedLogs.forEach(log => {
        const dateKey = log.dateString || 'Unknown Date';
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(log);
      });
    }
    return Object.entries(groups);
  }, [globalLogs, attendanceQuery]);

  // ✅ 2. FILTERED & SECTION-WISE STUDENT ROSTER GROUPING (STUDENTS)
  const filteredGroupedStudentsBySection = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (Array.isArray(globalStudents)) {
      const query = studentsQuery.toLowerCase().trim();

      const filtered = globalStudents.filter(student => 
        (student.name || '').toLowerCase().includes(query) ||
        (student.rollNumber || '').toLowerCase().includes(query) ||
        (student.assignedClass || student.class || student.section || '').toLowerCase().includes(query)
      );

      filtered.forEach(student => {
        const sectionKey = (student.assignedClass || student.class || student.section || 'General').toString().toUpperCase().trim();
        if (!groups[sectionKey]) groups[sectionKey] = [];
        groups[sectionKey].push(student);
      });
    }
    return Object.entries(groups);
  }, [globalStudents, studentsQuery]);

  // ✅ 3. FILTERED FACULTY MASTER DIRECTORY (FACULTY)
  const filteredFacultyList = useMemo(() => {
    if (!Array.isArray(globalTeachers)) return [];
    const query = facultyQuery.toLowerCase().trim();
    return globalTeachers.filter(teacher => 
      (teacher.name || '').toLowerCase().includes(query) ||
      (teacher.employeeId || '').toLowerCase().includes(query) ||
      (teacher.department || '').toLowerCase().includes(query) ||
      (teacher.designation || '').toLowerCase().includes(query)
    );
  }, [globalTeachers, facultyQuery]);

  // COMPUTE GLOBAL ANALYTICAL TOTALS
  const calculatedStats = useMemo(() => {
    return {
      totalLogCount: globalLogs.length,
      totalFacultyCount: globalTeachers.length,
      totalStudentCount: globalStudents.length
    };
  }, [globalLogs, globalTeachers, globalStudents]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🏢 PROFILE HERO HEADER */}
      <View style={styles.profileHeroSection}>
        <View style={styles.heroLeft}>
          <Text style={styles.greetingSubtitle}>OVERVIEW PORTAL</Text>
          <Text style={styles.greetingTitle}>System Monitor</Text>
          <View style={styles.departmentBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#007AFF" style={{ marginRight: 4 }} />
            <Text style={styles.departmentBadgeText}>READ-ONLY AUDIT MODE</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.avatarCircle} 
          onPress={() => { 
            if(typeof setCurrentTeacher === 'function') setCurrentTeacher(null); 
            router.replace('/login'); 
          }}
        >
          <Ionicons name="log-out" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 📊 LIVE SNAPSHOT METRICS STRIP */}
      <View style={styles.metricsWrapperCard}>
        <Text style={styles.cardHeaderLabel}>LIVE CLUSTER METRICS DIRECTORY</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F0FF' }]}>
              <Ionicons name="people" size={16} color="#007AFF" />
            </View>
            <Text style={styles.statNumber}>{calculatedStats.totalStudentCount}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          
          <View style={styles.dividerLine} />

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#E4F9E9' }]}>
              <Ionicons name="school" size={16} color="#34C759" />
            </View>
            <Text style={styles.statNumber}>{calculatedStats.totalFacultyCount}</Text>
            <Text style={styles.statLabel}>Instructors</Text>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.statItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#F4E8FF' }]}>
              <Ionicons name="receipt" size={16} color="#AF52DE" />
            </View>
            <Text style={styles.statNumber}>{calculatedStats.totalLogCount}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </View>
      </View>

      {/* 🚀 RENAMED SEGMENTED TAB NAVIGATION */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'attendance' && styles.activeTabButton]} onPress={() => setActiveTab('attendance')}>
          <Ionicons name="calendar-sharp" size={14} color={activeTab === 'attendance' ? '#FFF' : '#8E8E93'} style={{ marginRight: 4 }} />
          <Text style={[styles.tabButtonText, activeTab === 'attendance' && styles.activeTabButtonText]}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === 'students' && styles.activeTabButton]} onPress={() => setActiveTab('students')}>
          <Ionicons name="people-sharp" size={14} color={activeTab === 'students' ? '#FFF' : '#8E8E93'} style={{ marginRight: 4 }} />
          <Text style={[styles.tabButtonText, activeTab === 'students' && styles.activeTabButtonText]}>Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === 'faculty' && styles.activeTabButton]} onPress={() => setActiveTab('faculty')}>
          <Ionicons name="git-network" size={14} color={activeTab === 'faculty' ? '#FFF' : '#8E8E93'} style={{ marginRight: 4 }} />
          <Text style={[styles.tabButtonText, activeTab === 'faculty' && styles.activeTabButtonText]}>Faculty Map</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Syncing core system datasets...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          
          {/* 📂 TAB 1: ATTENDANCE HISTORY VIEW WITH REAL-TIME FILTER BAR */}
          {activeTab === 'attendance' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchBarInput}
                  placeholder="Filter logs by class, teacher or date..."
                  value={attendanceQuery}
                  onChangeText={setAttendanceQuery}
                  placeholderTextColor="#8E8E93"
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {filteredGroupedHistoryLogs.length === 0 ? (
                  <Text style={styles.emptyText}>No matching log entries found.</Text>
                ) : (
                  filteredGroupedHistoryLogs.map(([dateString, logs]) => (
                    <View key={dateString} style={styles.dateBlock}>
                      <Text style={styles.dateBlockHeader}>📅 Date: {dateString}</Text>
                      {logs.map((log, index) => {
                        const logId = log._id || log.id || `log_${index}`;
                        const isExpanded = expandedLogId === logId;
                        return (
                          <View key={logId} style={styles.dataCard}>
                            <TouchableOpacity onPress={() => toggleLogExpansion(logId)} activeOpacity={0.7}>
                              <View style={styles.cardHeader}>
                                <View style={styles.classBadge}><Text style={styles.classBadgeText}>{log.className}</Text></View>
                                <Text style={styles.timeText}>{log.submissionTime}</Text>
                              </View>
                              <Text style={styles.metaLine}>Instructor: <Text style={styles.boldText}>{log.teacherName}</Text></Text>
                              <Text style={styles.metaLine}>Attendance Metrics: <Text style={styles.greenText}>{log.presentCount} Present</Text> / {log.totalStudents} Total</Text>
                              <Text style={styles.expansionHint}>{isExpanded ? "▲ Hide Roster Breakdowns" : "▼ View Roster Breakdowns"}</Text>
                            </TouchableOpacity>

                            {isExpanded && Array.isArray(log.studentsSnapshot) && (
                              <View style={styles.snapshotRosterContainer}>
                                {log.studentsSnapshot.map((student: any, sIdx: number) => {
                                  const isPresent = student.status === 'Present';
                                  const cleanRoll = student.rollNumber && student.rollNumber.includes('-') ? student.rollNumber.split('-')[0] : student.rollNumber;
                                  return (
                                    <View key={student._id || student.id || sIdx} style={styles.snapshotRow}>
                                      <Text style={styles.snapshotStudentName}>{student.name} <Text style={{color:'#8E8E93', fontWeight:'400'}}>({cleanRoll})</Text></Text>
                                      <View style={[styles.staticBadge, isPresent ? styles.badgePresent : styles.badgeAbsent]}>
                                        <Text style={[styles.staticBadgeText, isPresent ? styles.textPresent : styles.textAbsent]}>{student.status.toUpperCase()}</Text>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* 📂 TAB 2: STUDENTS VIEW GROUPED BY SECTION WITH REAL-TIME FILTER BAR */}
          {activeTab === 'students' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchBarInput}
                  placeholder="Search students by name, roll no or class..."
                  value={studentsQuery}
                  onChangeText={setStudentsQuery}
                  placeholderTextColor="#8E8E93"
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {filteredGroupedStudentsBySection.length === 0 ? (
                  <Text style={styles.emptyText}>No matching student data profiles found.</Text>
                ) : (
                  filteredGroupedStudentsBySection.map(([sectionName, studentsInSec]) => (
                    <View key={sectionName} style={styles.sectionContainerBlock}>
                      <View style={styles.sectionHeaderRibbon}>
                        <Ionicons name="folder-open" size={16} color="#007AFF" />
                        <Text style={styles.sectionHeaderRibbonText}>Section: {sectionName.toUpperCase()}</Text>
                        <Text style={styles.sectionCounter}>({studentsInSec.length} Students)</Text>
                      </View>
                      
                      {studentsInSec.map((student, sIdx) => {
                        const cleanRoll = student.rollNumber && student.rollNumber.includes('-') 
                          ? student.rollNumber.split('-')[0] 
                          : student.rollNumber;

                        return (
                          <View key={student._id || student.id || sIdx} style={styles.studentItemRow}>
                            <Ionicons name="person-outline" size={13} color="#636366" style={{ marginRight: 8 }} />
                            <Text style={styles.studentItemName}>{student.name}</Text>
                            <Text style={styles.studentItemRoll}>Roll reference: {cleanRoll}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* 📂 TAB 3: FACULTY DEPLOYMENT TRACKING WITH REAL-TIME FILTER BAR */}
          {activeTab === 'faculty' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchBarInput}
                  placeholder="Filter teachers by name, ID or department..."
                  value={facultyQuery}
                  onChangeText={setFacultyQuery}
                  placeholderTextColor="#8E8E93"
                  clearButtonMode="while-editing"
                />
              </View>

              <FlatList 
                data={filteredFacultyList}
                keyExtractor={(item, index) => item._id || item.id || index.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No matching faculty listings recorded.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.teacherCard}>
                    <View style={styles.teacherHeader}>
                      <Ionicons name="person-circle-outline" size={26} color="#007AFF" style={{ marginRight: 8 }} />
                      <View>
                        <Text style={styles.teacherName}>{item.name}</Text>
                        <Text style={styles.teacherIdText}>ID: {item.employeeId || 'N/A'} • {item.designation || 'Faculty'}</Text>
                      </View>
                    </View>
                    <View style={styles.teacherMetaRow}>
                      <Text style={styles.metaLabel}>Assigned Department: </Text>
                      <View style={styles.deptBadge}><Text style={styles.deptBadgeText}>{(item.department || 'GEN').toUpperCase()}</Text></View>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#8E8E93', fontWeight: '500' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  listContainer: { padding: 16, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontStyle: 'italic', fontSize: 14 },

  // Profile Hero Layout
  profileHeroSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginHorizontal: 16, marginTop: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  heroLeft: { flex: 1 },
  greetingSubtitle: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  greetingTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 2 },
  departmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFE5A3' },
  departmentBadgeText: { color: '#FF9500', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },

  // Metric Snapshot Card setup
  metricsWrapperCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  cardHeaderLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '700', letterSpacing: 1, marginBottom: 14, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  dividerLine: { width: 1, height: 36, backgroundColor: '#E5E5EA' },

  // Tab Selection Strip Layout
  tabBar: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 3, marginHorizontal: 16, marginBottom: 14, gap: 4 },
  tabButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  activeTabButton: { backgroundColor: '#007AFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabButtonText: { fontSize: 12, fontWeight: '600', color: '#636366' },
  activeTabButtonText: { color: '#FFFFFF', fontWeight: '700' },

  // 🔍 Dashboard Search Input Setup
  searchBarContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', paddingHorizontal: 12, height: 44, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 1, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchBarInput: { flex: 1, color: '#1C1C1E', fontSize: 13, height: '100%', fontWeight: '500' },

  // Attendance Tab Structural styles
  dateBlock: { marginBottom: 16 },
  dateBlockHeader: { fontSize: 13, fontWeight: '800', color: '#48484A', marginBottom: 10, backgroundColor: '#E5E5EA', padding: 8, borderRadius: 8, overflow: 'hidden', letterSpacing: 0.2 },
  dataCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderColor: '#F2F2F7', paddingBottom: 8 },
  classBadge: { backgroundColor: '#E0F0FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  classBadgeText: { color: '#007AFF', fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  metaLine: { fontSize: 13, color: '#3A3A3C', marginTop: 4, fontWeight: '500' },
  boldText: { fontWeight: '700', color: '#1C1C1E' },
  greenText: { color: '#34C759', fontWeight: '700' },
  expansionHint: { fontSize: 11, color: '#007AFF', fontWeight: '700', marginTop: 8, fontStyle: 'italic' },
  
  snapshotRosterContainer: { marginTop: 12, borderTopWidth: 1, borderColor: '#E5E5EA', paddingTop: 10, gap: 6 },
  snapshotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F8FA', padding: 8, borderRadius: 6 },
  snapshotStudentName: { fontSize: 12, fontWeight: '600', color: '#1C1C1E' },
  staticBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, minWidth: 64, alignItems: 'center' },
  badgePresent: { backgroundColor: '#E4F9E9' },
  badgeAbsent: { backgroundColor: '#FFE5E5' },
  staticBadgeText: { fontSize: 10, fontWeight: '800' },
  textPresent: { color: '#34C759' },
  textAbsent: { color: '#FF3B30' },

  // Students Tab Structural styles
  sectionContainerBlock: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA' },
  sectionHeaderRibbon: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F2F2F7', paddingBottom: 8, marginBottom: 10 },
  sectionHeaderRibbonText: { fontSize: 14, fontWeight: '800', color: '#1C1C1E', marginLeft: 6, flex: 1 },
  sectionCounter: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  studentItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#F2F2F7' },
  studentItemName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  studentItemRoll: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

  // Faculty Tab Structural styles
  teacherCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10 },
  teacherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  teacherName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  teacherIdText: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  teacherMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderColor: '#F2F2F7', paddingTop: 8 },
  metaLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  deptBadge: { backgroundColor: '#F4E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 4 },
  deptBadgeText: { color: '#AF52DE', fontSize: 11, fontWeight: '700' }
});