import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppGlobalState, API_BASE_URL } from '../AppContext'; 
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface Student {
  _id: string;
  id?: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  assignedClass: string;
}

export default function AttendanceScreen() {
  const { currentTeacher, fetchHistoryLogsFromDatabase } = useAppGlobalState(); 
  const [students, setStudents] = useState<Student[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // States
  const [selectedClass, setSelectedClass] = useState<string | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false); 
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: 'Present' | 'Absent' }>({});

  if (!currentTeacher) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: '600', color: '#FF3B30' }}>Access Denied. Please log in first.</Text>
      </View>
    ); 
  }

  const activeTeacherId = currentTeacher.id || (currentTeacher as any)._id;

  const fetchDatabaseRosters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/teacher/${activeTeacherId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const fetchedStudents: Student[] = data.students || [];
        setStudents(fetchedStudents);

        const uniqueSections = Array.from(
          new Set(fetchedStudents.map(s => s.assignedClass || s.class || s.section))
        ).filter(Boolean) as string[];

        setClassList(uniqueSections);

        if (uniqueSections.length > 0 && !selectedClass) {
          setSelectedClass(uniqueSections[0]);
        }
      } else {
        Alert.alert("Server Error", "Could not fetch dynamic database allocations.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Connection Failure", "Failed to pull rosters from backend connection string.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDatabaseRosters();
    }, [currentTeacher])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDatabaseRosters();
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); 
    if (date) setSelectedDate(date); 
  };

  const toggleAttendanceStatus = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleFinalSubmit = async () => {
    if (!selectedClass) {
      Alert.alert("Omission", "Please select an active target class folder section chip.");
      return;
    }

    const currentFilteredRoster = students.filter(s => 
      (s.class === selectedClass) || (s.assignedClass === selectedClass) || (s.section === selectedClass)
    );

    if (currentFilteredRoster.length === 0) {
      Alert.alert("Empty Roster", "There are no students registered inside this database partition to submit."); 
      return;
    }

    const snapshotPayload = currentFilteredRoster.map(s => ({
      id: s._id || s.id,
      name: s.name, 
      rollNumber: s.rollNumber, 
      status: attendanceStatus[s._id] || 'Present' 
    }));

    const presentCount = snapshotPayload.filter(s => s.status === 'Present').length; 

    const payloadBody = {
      className: selectedClass, 
      dateString: selectedDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      submissionTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      teacherName: currentTeacher.name || "Instructor Account", 
      teacherId: activeTeacherId,
      presentCount, 
      totalStudents: currentFilteredRoster.length,
      studentsSnapshot: snapshotPayload
    };

    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody)
      });

      const resData = await response.json(); 
      if (response.ok && resData.success) {
        if (typeof fetchHistoryLogsFromDatabase === 'function') {
          fetchHistoryLogsFromDatabase(activeTeacherId);
        }

        Alert.alert(
          "Success 🎉", 
          `Attendance report has been permanently stored in archives!\nPresent: ${presentCount}/${currentFilteredRoster.length}`,
          [{ text: "Great", onPress: () => setAttendanceStatus({}) }]
        );
      } else {
        Alert.alert("Submission Denied", resData.message || "Database engine tracking transaction rejected.");
      }
    } catch (err) {
      Alert.alert("Transmission Error", "Failed to communicate with analytics backend server api endpoint.");
    }
  };

  const filteredStudentsList = students.filter(s => 
    selectedClass ? (s.class === selectedClass || s.assignedClass === selectedClass || s.section === selectedClass) : false
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}> 
      <View style={styles.container}> 
        <View style={styles.calendarStrip}> 
          <TouchableOpacity style={styles.calendarButton} onPress={() => setShowDatePicker(true)}> 
            <Text style={styles.calendarBtnText}>📅 Target Date</Text> 
          </TouchableOpacity>
          <Text style={styles.activeDateDisplay}>
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text> 
        </View>

        {showDatePicker && ( 
          <DateTimePicker 
            value={selectedDate} 
            mode="date" 
            display="default" 
            maximumDate={new Date()} 
            onChange={onDateChange} 
          /> 
        )}

        <View style={[styles.statusBanner, styles.openBanner]}> 
          <Text style={styles.bannerText}>🔓 Database Connection Synced (Active Inputs Unlocked)</Text>
        </View>

        <View style={styles.scrollWrapper}> 
          {classList.length === 0 ? (
            <Text style={styles.noClassesHint}>⚠️ No sections discovered. Upload excel folders first.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classSelectorScroll}> 
              {classList.map((className) => {
                const isSelected = selectedClass === className;
                return (
                  <TouchableOpacity 
                    key={className} 
                    style={[styles.classTab, isSelected ? styles.activeClassTab : styles.inactiveClassTab]} 
                    onPress={() => setSelectedClass(className)}
                  >
                    <Text style={[styles.classTabRules, isSelected ? styles.activeClassText : styles.inactiveClassText]}> 
                      {className.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 8, color: '#8E8E93', fontWeight: '500' }}>Compiling MongoDB Roster Logs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudentsList}
            keyExtractor={(item, index) => item._id || item.id || index.toString()} 
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContainer} 
            ListEmptyComponent={
              <Text style={styles.emptyText}>No registered students found in this folder partition layout view.</Text>
            } 
            renderItem={({ item, index }) => {
              const uniqueStudentId = item._id || item.id || `fallback_${index}`; 
              const currentMarkedStatus = attendanceStatus[uniqueStudentId] || 'Present';

              // ✅ VISUAL CLEAN DISPLAY UPGRADE: Isolates clean number "1" out of compound strings
              const cleanDisplayRollNumber = item.rollNumber && item.rollNumber.includes('-') 
                ? item.rollNumber.split('-')[0] 
                : item.rollNumber;

              return (
                <View style={styles.studentCard}> 
                  <View style={styles.studentDetails}> 
                    <Text style={styles.studentName}>{item.name}</Text> 
                    <Text style={styles.rollText}>Roll No: {cleanDisplayRollNumber}</Text>
                  </View>

                  <View style={styles.actionButtons}> 
                    <TouchableOpacity 
                      style={[styles.statusBtn, styles.presentBtn, currentMarkedStatus === 'Present' ? styles.activePresent : styles.inactiveBtn]} 
                      onPress={() => toggleAttendanceStatus(uniqueStudentId, 'Present')}
                    >
                      <Text style={[styles.btnText, currentMarkedStatus === 'Present' ? styles.activeText : styles.inactivePresentText]}>P</Text> 
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.statusBtn, styles.absentBtn, currentMarkedStatus === 'Absent' ? styles.activeAbsent : styles.inactiveBtn]} 
                      onPress={() => toggleAttendanceStatus(uniqueStudentId, 'Absent')}
                    >
                      <Text style={[styles.btnText, currentMarkedStatus === 'Absent' ? styles.activeText : styles.inactiveAbsentText]}>A</Text> 
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}

        {selectedClass && (
          <TouchableOpacity style={styles.submitButton} onPress={handleFinalSubmit}> 
            <Text style={styles.submitButtonText}>Publish {selectedClass.toUpperCase()} Attendance</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 10 }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
  calendarStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 15 }, 
  calendarButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }, 
  calendarBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '600' }, 
  activeDateDisplay: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' }, 
  statusBanner: { paddingVertical: 6, alignItems: 'center', marginBottom: 10 }, 
  openBanner: { backgroundColor: '#E4F9E9' }, 
  bannerText: { fontSize: 12, fontWeight: '700', color: '#1E7E34', letterSpacing: 0.3 }, 
  scrollWrapper: { height: 44, marginBottom: 10, justifyContent: 'center' }, 
  classSelectorScroll: { paddingHorizontal: 16, gap: 10, alignItems: 'center' }, 
  noClassesHint: { fontSize: 13, color: '#8E8E93', fontWeight: '600', paddingHorizontal: 16, fontStyle: 'italic' },
  classTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1, justifyContent: 'center', height: 34 }, 
  inactiveClassTab: { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA' }, 
  activeClassTab: { backgroundColor: '#007AFF', borderColor: '#007AFF' }, 
  classTabRules: { fontSize: 13, fontWeight: '700' }, 
  inactiveClassText: { color: '#8E8E93' }, 
  activeClassText: { color: '#FFFFFF' }, 
  listContainer: { paddingHorizontal: 16, paddingBottom: 90 }, 
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 30, fontSize: 14, fontStyle: 'italic' }, 
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }, 
  studentDetails: { flex: 1 }, 
  studentName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' }, 
  rollText: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontWeight: '500' }, 
  actionButtons: { flexDirection: 'row', gap: 8 }, 
  statusBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }, 
  btnText: { fontSize: 14, fontWeight: 'bold' }, 
  presentBtn: { borderColor: '#34C759' }, 
  absentBtn: { borderColor: '#FF3B30' }, 
  inactiveBtn: { backgroundColor: '#FFFFFF' }, 
  activePresent: { backgroundColor: '#34C759' }, 
  activeAbsent: { backgroundColor: '#FF3B30' }, 
  activeText: { color: '#FFFFFF' }, 
  inactivePresentText: { color: '#34C759' }, 
  inactiveAbsentText: { color: '#FF3B30' }, 
  submitButton: { position: 'absolute', bottom: 15, left: 16, right: 16, backgroundColor: '#007AFF', height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 }, 
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' } 
});