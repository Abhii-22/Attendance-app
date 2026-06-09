import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useAppGlobalState } from '../AppContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function HistoryScreen() {
  const { historyLogs, currentTeacher } = useAppGlobalState();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  if (!currentTeacher) return <View style={styles.center}><Text>Access Denied.</Text></View>;

  const toggleCardExpansion = (id?: string) => {
    if (!id) return;
    setExpandedLogId(prevId => (prevId === id ? null : id));
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setFilterDate(date);
    }
  };

  const filteredHistoryLogs = useMemo(() => {
    if (!filterDate) return historyLogs;

    const targetDateStr = filterDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const targetClean = targetDateStr.replace(/\s+/g, '').toLowerCase();

    return historyLogs.filter((log) => {
      if (!log.dateString) return false;
      const logClean = log.dateString.replace(/\s+/g, '').toLowerCase();
      return logClean === targetClean;
    });
  }, [historyLogs, filterDate]);

  return (
    <View style={styles.container}>
      <View style={[styles.cardHeader, { borderBottomWidth: 0, marginBottom: 4 }]}>
        <TouchableOpacity 
          style={styles.classBadge} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: '#007AFF', fontWeight: '700' }}>
            📅 {filterDate ? filterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Search by Date..."}
          </Text>
        </TouchableOpacity>

        {filterDate && (
          <TouchableOpacity 
            style={[styles.classBadge, { backgroundColor: '#FFE5E5' }]} 
            onPress={() => setFilterDate(null)}
          >
            <Text style={{ color: '#FF3B30', fontWeight: '700' }}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker 
          value={filterDate || new Date()} 
          mode="date" 
          display="default" 
          maximumDate={new Date()} 
          onChange={onDateChange} 
        />
      )}

      <FlatList
        data={filteredHistoryLogs} 
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Historical Submissions Found</Text>
            <Text style={styles.emptySubtitle}>Published attendance logs will be fetched securely from MongoDB and listed here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const logUniqueId = item._id || item.id;
          const isExpanded = expandedLogId === logUniqueId;

          return (
            <View style={styles.historyCard}>
              <TouchableOpacity onPress={() => toggleCardExpansion(logUniqueId)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <Text style={styles.classBadge}>{item.className}</Text>
                  <Text style={styles.timeLabel}>{item.submissionTime}</Text>
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.dateLabel}>📅 Date: <Text style={styles.dateVal}>{item.dateString}</Text></Text>
                  <Text style={styles.metricLabel}>📊 Attendance: <Text style={styles.metricVal}>{item.presentCount} / {item.totalStudents} Present</Text></Text>
                  <Text style={styles.clickHint}>{isExpanded ? "▲ Tap to Hide Roster Details" : "▼ Tap to View Roster Breakdown"}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.rosterExpansionPanel}>
                  <Text style={styles.panelTitle}> Roster Snapshot (Database Record)</Text>
                  {item.studentsSnapshot.map((student, index) => {
                    const isPresent = student.status === 'Present';
                    const studentKey = student._id || student.id || `snap_${index}`;
                    
                    // ✅ MASK IN PROGRESS FOR RETROACTIVE SEARCH STRINGS
                    const cleanDisplayRollNumber = student.rollNumber && student.rollNumber.includes('-') 
                      ? student.rollNumber.split('-')[0] 
                      : student.rollNumber;

                    return (
                      <View key={studentKey} style={styles.studentRowSnapshot}>
                        <View style={styles.studentMeta}>
                          <Text style={styles.studentNameText}>{student.name}</Text>
                          <Text style={styles.studentRollText}>{cleanDisplayRollNumber}</Text>
                        </View>
                        <View style={[styles.staticBadge, isPresent ? styles.badgePresent : styles.badgeAbsent]}>
                          <Text style={[styles.badgeText, isPresent ? styles.textPresent : styles.textAbsent]}>
                            {student.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.footerSignature}>Logged by Account: {item.teacherName}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingBottom: 30 },
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#E5E5EA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 10, marginBottom: 12 },
  classBadge: { backgroundColor: '#E0F0FF', color: '#007AFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 13, fontWeight: '700' },
  timeLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  cardBody: { gap: 4 },
  dateLabel: { fontSize: 14, color: '#3A3A3C', fontWeight: '500' },
  dateVal: { color: '#1C1C1E', fontWeight: '600' },
  metricLabel: { fontSize: 14, color: '#3A3A3C', fontWeight: '500' },
  metricVal: { color: '#34C759', fontWeight: '700' },
  clickHint: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 8, fontStyle: 'italic' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 8, marginTop: 12 },
  footerSignature: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' },
  rosterExpansionPanel: { marginTop: 15, padding: 12, backgroundColor: '#F8F8FA', borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', gap: 8 },
  panelTitle: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  studentRowSnapshot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EFEFF2' },
  studentMeta: { flex: 1 },
  studentNameText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  studentRollText: { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  staticBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 74, alignItems: 'center' },
  badgePresent: { backgroundColor: '#E4F9E9' },
  badgeAbsent: { backgroundColor: '#FFE5E5' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  textPresent: { color: '#34C759' },
  textAbsent: { color: '#FF3B30' }
});