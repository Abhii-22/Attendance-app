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
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentBadgeText}>{currentTeacher.department}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>
              {currentTeacher.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* METRICS */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E0F0FF', borderColor: '#B3D7FF' }]}>
            <Ionicons name="people" size={22} color="#007AFF" />
            <Text style={[styles.statNumber, { color: '#0056B3' }]}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E4F9E9', borderColor: '#B9F0C8' }]}>
            <Ionicons name="library" size={22} color="#34C759" />
            <Text style={[styles.statNumber, { color: '#1E6B30' }]}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F4E8FF', borderColor: '#E1C4FF' }]}>
            <Ionicons name="checkmark-done-circle" size={22} color="#AF52DE" />
            <Text style={[styles.statNumber, { color: '#6A1B9A' }]}>{myRecentLogs}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
        </View>

        {/* UPDATED QUICK ACTIONS GRID */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {/* Primary Action */}
          <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => router.push('/(tabs)/attendance')}>
            <Ionicons name="calendar" size={32} color="#FFFFFF" />
            <Text style={styles.actionTextPrimary}>Take Attendance</Text>
          </TouchableOpacity>

          {/* Secondary Actions Column */}
          <View style={styles.secondaryActionsColumn}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/history')}>
              <Ionicons name="time" size={20} color="#007AFF" />
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/analytics')}>
              <Ionicons name="pie-chart" size={20} color="#FF9500" />
              <Text style={styles.secondaryActionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-add" size={20} color="#AF52DE" />
              <Text style={styles.secondaryActionText}>Students</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentActivityBox}>
          <Ionicons name="information-circle-outline" size={18} color="#8E8E93" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.activityText}>All systems operational. Ensure all logs are submitted daily.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, marginTop: 10 },
  greetingTextContainer: { flex: 1 },
  greetingTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 2 },
  greetingSubtitle: { fontSize: 13, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  departmentBadge: { backgroundColor: '#E0F0FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  departmentBadgeText: { color: '#007AFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  statNumber: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 14, letterSpacing: -0.2 },
  actionGrid: { flexDirection: 'row', height: 190, marginBottom: 20 },
  actionButton: { borderRadius: 20, padding: 20, justifyContent: 'space-between' },
  primaryAction: { flex: 1, backgroundColor: '#007AFF', borderRadius: 20, padding: 20, justifyContent: 'flex-end', marginRight: 12, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  actionTextPrimary: { color: '#FFF', fontSize: 19, fontWeight: '800', marginTop: 12, lineHeight: 24, letterSpacing: -0.3 },
  secondaryActionsColumn: { flex: 1, gap: 8 },
  secondaryAction: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  secondaryActionText: { fontWeight: '700', fontSize: 14, color: '#1C1C1E', marginLeft: 2 },
  recentActivityBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E5E5EA' },
  activityText: { color: '#666', fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 20 },
  fallbackText: { marginBottom: 20, fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  loginBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});