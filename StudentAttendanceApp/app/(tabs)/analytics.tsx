import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, SafeAreaView } from 'react-native';
// ✅ Using the correct shared global state context hook
import { useAppGlobalState } from '../AppContext';

export default function AnalyticsScreen() {
  const { allStudentsData, historyLogs } = useAppGlobalState();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Flatten all students into a single array for easier list filtering
  const allStudentsList = useMemo(() => {
    const list: any[] = [];
    Object.keys(allStudentsData).forEach((className) => {
      allStudentsData[className].forEach((student) => {
        list.push({ ...student, className });
      });
    });
    return list;
  }, [allStudentsData]);

  // 2. Filter students dynamically based on search query matching name or roll number
  const filteredStudents = allStudentsList.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Analytics Calculation Engine
  const getStudentStats = (studentId: string, rollNumber: string) => {
    let presentCount = 0;
    let totalClasses = 0;

    historyLogs.forEach(log => {
      // ✅ FIX: Cross-matches by database _id, local id, OR unique Roll Number.
      // This stops calculations from resetting to 0% across refreshes!
      const record = log.studentsSnapshot.find(s => 
        (s._id && s._id === studentId) || 
        (s.id && s.id === studentId) || 
        (s.rollNumber === rollNumber)
      );
      
      if (record) {
        totalClasses++;
        if (record.status === 'Present') presentCount++;
      }
    });

    const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);
    return { presentCount, totalClasses, percentage };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Analytics</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search name or roll number..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredStudents}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        renderItem={({ item }) => {
          // Send both the dynamic IDs and the immutable Roll Number into the logic block
          const targetId = item._id || item.id || '';
          const stats = getStudentStats(targetId, item.rollNumber);
          
          // Color code thresholds based on attendance performance values
          let color = stats.percentage < 60 ? '#FF3B30' : stats.percentage < 75 ? '#FF9500' : '#34C759';

          return (
            <View style={styles.statCard}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.details}>{item.rollNumber} • {item.className}</Text>
                </View>
                <View style={styles.cardStatsCol}>
                  <Text style={[styles.percent, { color }]}>{stats.percentage}%</Text>
                  <Text style={styles.classesCount}>{stats.presentCount}/{stats.totalClasses} Days</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${stats.percentage}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  statCard: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 15, borderRadius: 12, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfoCol: { flex: 1 },
  cardStatsCol: { alignItems: 'flex-end' },
  name: { fontSize: 16, fontWeight: '700' },
  details: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  percent: { fontSize: 20, fontWeight: '800' },
  classesCount: { fontSize: 10, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  progressBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%' }
});