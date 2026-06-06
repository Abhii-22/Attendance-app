import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppGlobalState } from '../AppContext'; 

export default function AttendanceScreen() {
  // Extract state variables and global operations from context engine
  const { allStudentsData, updateAttendance, saveToHistoryLog, currentTeacher } = useAppGlobalState();
  const classList = ['CSE A', 'CSE B', 'AIML', 'ECE'];

  // Local state controls
  const [selectedClass, setSelectedClass] = useState<string>('CSE A');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Security session boundary fallback protection
  if (!currentTeacher) {
    return (
      <View style={styles.center}>
        <Text>Access Denied. Please log in first.</Text>
      </View>
    );
  }

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const handleFinalSubmit = () => {
    const classRoster = allStudentsData[selectedClass] || [];
    if (classRoster.length === 0) {
      Alert.alert("Empty Roster", "There are no students registered in this class section to report.");
      return;
    }

    const presentCount = classRoster.filter(s => s.status === 'Present').length;
    const totalCount = classRoster.length;

    Alert.alert(
      "Confirm Submission",
      `Submit report for ${selectedClass}?\nPresent: ${presentCount}/${totalCount}\n\nThis will generate a permanent, unchangeable attendance breakdown snapshot log inside your History tab records directory.`,
      [
        { text: "Cancel Layout", style: "cancel" },
        { 
          text: "Submit & Lock Log", 
          onPress: () => {
            // Triggers the background data context snapshot snapshot array cloning function
            saveToHistoryLog(selectedClass, selectedDate);
            Alert.alert("Success", "Attendance report has been stored securely in permanent history archives!");
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Target Date Configuration Header Block */}
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

      {/* Mode Status Visual Label Indicator Banner */}
      <View style={[styles.statusBanner, styles.openBanner]}>
        <Text style={styles.bannerText}>🔓 Active Session (Inputs Unlocked & Modifiable)</Text>
      </View>

      {/* Horizontal Class Section Filter Segment Scroller Selection Row */}
      <View style={styles.scrollWrapper}>
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
                  {className}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dynamic Active Interactive Class Roster List View */}
      <FlatList
        data={allStudentsData[selectedClass] || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No registered students found in this group roster section.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.rollText}>{item.rollNumber}</Text>
            </View>

            {/* Toggle Status Input Option Buttons Area Row Container */}
            <View style={styles.actionButtons}>
              {/* Present Option Circle Trigger Button */}
              <TouchableOpacity 
                style={[styles.statusBtn, styles.presentBtn, item.status === 'Present' ? styles.activePresent : styles.inactiveBtn]} 
                onPress={() => updateAttendance(selectedClass, item.id, 'Present')}
              >
                <Text style={[styles.btnText, item.status === 'Present' ? styles.activeText : styles.inactivePresentText]}>P</Text>
              </TouchableOpacity>

              {/* Absent Option Circle Trigger Button */}
              <TouchableOpacity 
                style={[styles.statusBtn, styles.absentBtn, item.status === 'Absent' ? styles.activeAbsent : styles.inactiveBtn]} 
                onPress={() => updateAttendance(selectedClass, item.id, 'Absent')}
              >
                <Text style={[styles.btnText, item.status === 'Absent' ? styles.activeText : styles.inactiveAbsentText]}>A</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Fixed Call-To-Action Submission Publishing Frame Switch Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleFinalSubmit}>
        <Text style={styles.submitButtonText}>Publish {selectedClass} Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Date configuration segment
  calendarStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 15 },
  calendarButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  calendarBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  activeDateDisplay: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  
  // Session details message alert label strip
  statusBanner: { paddingVertical: 6, alignItems: 'center', marginBottom: 10 },
  openBanner: { backgroundColor: '#E4F9E9' },
  bannerText: { fontSize: 12, fontWeight: '700', color: '#1E7E34', letterSpacing: 0.3 },
  
  // Class filter elements parameters
  scrollWrapper: { height: 44, marginBottom: 10 },
  classSelectorScroll: { paddingHorizontal: 16, gap: 10 },
  classTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  inactiveClassTab: { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA' },
  activeClassTab: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  classTabRules: { fontSize: 13, fontWeight: '700' },
  inactiveClassText: { color: '#8E8E93' },
  activeClassText: { color: '#FFFFFF' },
  
  // FlatList content and card wrappers styles configuration parameters
  listContainer: { paddingHorizontal: 16, paddingBottom: 80 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 30, fontSize: 14 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  studentDetails: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  rollText: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  
  // Action toggle buttons layout properties definitions variables
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
  
  // Bottom fixed control block
  submitButton: { position: 'absolute', bottom: 15, left: 16, right: 16, backgroundColor: '#007AFF', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});