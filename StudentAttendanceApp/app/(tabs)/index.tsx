import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { currentTeacher, allStudentsData, historyLogs } = useAppGlobalState();

  if (!currentTeacher) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Session Expired. Please Log In.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalClasses = Object.keys(allStudentsData).length;
  const totalStudents = Object.values(allStudentsData).reduce((acc, currentClass) => acc + currentClass.length, 0);
  const myRecentLogs = historyLogs.filter(log => log.teacherId === currentTeacher.id).length;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingSubtitle}>{greeting},</Text>
            <Text style={styles.greetingTitle}>{currentTeacher.name}</Text>
            <Text style={styles.departmentBadge}>{currentTeacher.department}</Text>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>{currentTeacher.name.split(' ').pop()?.substring(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* METRICS */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E0F0FF' }]}><Ionicons name="people" size={24} color="#007AFF" /><Text style={styles.statNumber}>{totalStudents}</Text><Text style={styles.statLabel}>Students</Text></View>
          <View style={[styles.statCard, { backgroundColor: '#E4F9E9' }]}><Ionicons name="library" size={24} color="#34C759" /><Text style={styles.statNumber}>{totalClasses}</Text><Text style={styles.statLabel}>Classes</Text></View>
          <View style={[styles.statCard, { backgroundColor: '#F4E8FF' }]}><Ionicons name="checkmark-done-circle" size={24} color="#AF52DE" /><Text style={styles.statNumber}>{myRecentLogs}</Text><Text style={styles.statLabel}>Logs</Text></View>
        </View>

        {/* UPDATED QUICK ACTIONS GRID */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {/* Primary Action */}
          <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => router.push('/(tabs)/attendance')}>
            <Ionicons name="calendar" size={28} color="#FFFFFF" />
            <Text style={styles.actionTextPrimary}>Take Attendance</Text>
          </TouchableOpacity>

          {/* Secondary Actions Column */}
          <View style={styles.secondaryActionsColumn}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/history')}>
              <Ionicons name="time" size={22} color="#007AFF" />
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/analytics')}>
              <Ionicons name="pie-chart" size={22} color="#FF9500" />
              <Text style={styles.secondaryActionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-add" size={22} color="#AF52DE" />
              <Text style={styles.secondaryActionText}>Students</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentActivityBox}>
          <Text style={styles.activityText}>All systems operational. Ensure all logs are submitted daily.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  greetingTextContainer: { flex: 1 }, // Ensure this exists!
  greetingTitle: { fontSize: 26, fontWeight: '800' },
  greetingSubtitle: { fontSize: 14, color: '#8E8E93', textTransform: 'uppercase' },
  departmentBadge: { color: '#007AFF', backgroundColor: '#E0F0FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, marginTop: 5, alignSelf: 'flex-start' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { flex: 1, padding: 15, borderRadius: 16, marginHorizontal: 4, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  statLabel: { fontSize: 11, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  actionGrid: { flexDirection: 'row', height: 200, marginBottom: 20 },
  actionButton: { borderRadius: 20, padding: 20, justifyContent: 'space-between' }, // Ensure this exists!
  primaryAction: { flex: 1, backgroundColor: '#007AFF', borderRadius: 20, padding: 20, justifyContent: 'flex-end', marginRight: 15 },
  actionTextPrimary: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  secondaryActionsColumn: { flex: 1, gap: 10 },
  secondaryAction: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  secondaryActionText: { fontWeight: '600', fontSize: 14 },
  recentActivityBox: { backgroundColor: '#FFF', padding: 20, borderRadius: 16 },
  activityText: { color: '#8E8E93', fontSize: 13 },
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { marginBottom: 20 },
  loginBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold' }
});