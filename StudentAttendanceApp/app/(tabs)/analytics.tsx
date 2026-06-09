import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAppGlobalState } from '../AppContext';
import { useFocusEffect } from '@react-navigation/native';

export default function AnalyticsScreen() {
  const { allStudentsData, historyLogs, currentTeacher, fetchHistoryLogsFromDatabase, refreshStudentsList } = useAppGlobalState();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentTeacher) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontWeight: '600', color: '#FF3B30' }}>Access Denied. Please log in first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeTeacherId = currentTeacher.id || (currentTeacher as any)._id;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const syncAnalyticsData = async () => {
        if (!activeTeacherId) return;
        try {
          if (isMounted) setLoading(true);
          if (typeof fetchHistoryLogsFromDatabase === 'function') {
            await fetchHistoryLogsFromDatabase(activeTeacherId);
          }
          if (typeof refreshStudentsList === 'function') {
            await refreshStudentsList();
          }
        } catch (error) {
          console.error("Analytics focus synchronization failed:", error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      syncAnalyticsData();

      return () => {
        isMounted = false;
      };
    }, [currentTeacher])
  );

  const allStudentsList = useMemo(() => {
    const list: any[] = [];
    Object.keys(allStudentsData).forEach((className) => {
      if (Array.isArray(allStudentsData[className])) {
        allStudentsData[className].forEach((student) => {
          list.push({ ...student, className });
        });
      }
    });
    return list;
  }, [allStudentsData]);

  const filteredStudents = allStudentsList.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentStats = (studentId: string, rollNumber: string) => {
    let presentCount = 0;
    let totalClasses = 0;

    const targetStudentIdStr = studentId ? studentId.toString().trim().toLowerCase() : '';
    const targetRollNumStr = rollNumber ? rollNumber.toString().trim().toLowerCase() : '';

    historyLogs.forEach(log => {
      const activeSnapshotArray = log.studentsSnapshot || (log as any).studentSnapshot || [];
      
      if (!Array.isArray(activeSnapshotArray)) return;

      const record = activeSnapshotArray.find(s => {
        const sId = s._id || s.id || '';
        const currentSnapIdStr = sId.toString().trim().toLowerCase();
        const currentSnapRollStr = s.rollNumber ? s.rollNumber.toString().trim().toLowerCase() : '';

        return (
          (targetStudentIdStr && currentSnapIdStr === targetStudentIdStr) || 
          (targetRollNumStr && currentSnapRollStr === targetRollNumStr)
        );
      });
      
      if (record) {
        totalClasses++;
        const standardizedStatus = record.status ? record.status.toString().trim().toLowerCase() : '';
        if (standardizedStatus === 'present') {
          presentCount++;
        }
      }
    });

    const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);
    return { presentCount, totalClasses, percentage };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Analytics</Text>
        <Text style={styles.headerSubtitle}>Real-time per-student percentage calculation sync.</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search name or roll number..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Syncing Database Analytics...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching students or data found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const targetId = item._id || item.id || '';
            const stats = getStudentStats(targetId, item.rollNumber);
            
            let color = stats.percentage < 60 ? '#FF3B30' : stats.percentage < 75 ? '#FF9500' : '#34C759';

            // ✅ DISPLAY MASK FOR SYSTEM SUFFIX CHECKS
            const displayRoll = item.rollNumber && item.rollNumber.includes('-')
              ? item.rollNumber.split('-')[0]
              : item.rollNumber;

            return (
              <View style={styles.statCard}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.details}>{displayRoll} • {item.className.toUpperCase()}</Text>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  searchInput: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  statCard: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfoCol: { flex: 1 },
  cardStatsCol: { alignItems: 'flex-end' },
  name: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  details: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  percent: { fontSize: 20, fontWeight: '800' },
  classesCount: { fontSize: 10, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  progressBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#8E8E93', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#8E8E93', fontSize: 14, fontStyle: 'italic' }
});