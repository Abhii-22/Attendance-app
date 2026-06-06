import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { currentTeacher, allStudentsData, historyLogs } = useAppGlobalState();

  // Fallback if session drops
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

  // Calculate dynamic dashboard metrics
  const totalClasses = Object.keys(allStudentsData).length;
  const totalStudents = Object.values(allStudentsData).reduce((acc, currentClass) => acc + currentClass.length, 0);
  const myRecentLogs = historyLogs.filter(log => log.teacherId === currentTeacher.id).length;

  // Greeting logic based on time
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TOP HEADER: Personalized Greeting & Info */}
        <View style={styles.header}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingSubtitle}>{greeting},</Text>
            <Text style={styles.greetingTitle}>{currentTeacher.name}</Text>
            <Text style={styles.departmentBadge}>{currentTeacher.department}</Text>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>
              {currentTeacher.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* METRICS OVERVIEW: Quick Information Architecture */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E0F0FF' }]}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E4F9E9' }]}>
            <Ionicons name="library" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Active Classes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F4E8FF' }]}>
            <Ionicons name="checkmark-done-circle" size={24} color="#AF52DE" />
            <Text style={styles.statNumber}>{myRecentLogs}</Text>
            <Text style={styles.statLabel}>Submitted Logs</Text>
          </View>
        </View>

        {/* QUICK ACTIONS GRID: Zig-Zag / Balanced Layout Navigation */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]} 
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/attendance')}
          >
            <View style={styles.iconWrapperPrimary}>
              <Ionicons name="calendar-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTextPrimary}>Take Attendance</Text>
            <Text style={styles.actionSubtextPrimary}>Mark today's roster</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsColumn}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]} 
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/history')}
            >
              <View style={styles.iconWrapperSecondary}>
                <Ionicons name="time-outline" size={22} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.actionTextSecondary}>View History</Text>
                <Text style={styles.actionSubtextSecondary}>Past logs</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]} 
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.iconWrapperSecondary}>
                <Ionicons name="person-add-outline" size={22} color="#AF52DE" />
              </View>
              <View>
                <Text style={styles.actionTextSecondary}>Add Students</Text>
                <Text style={styles.actionSubtextSecondary}>Update roster</Text>
              </View>
            </TouchableOpacity>
          </View>
          
        </View>

        {/* RECENT ACTIVITY HINT */}
        <View style={styles.recentActivityBox}>
          <View style={styles.activityHeader}>
            <Ionicons name="information-circle" size={20} color="#8E8E93" />
            <Text style={styles.activityTitle}>System Status</Text>
          </View>
          <Text style={styles.activityText}>
            All systems operational. Make sure to submit all pending attendance logs before the end of your shift today.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, paddingBottom: 40 },
  
  // Fallback UI
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  fallbackText: { fontSize: 16, color: '#8E8E93', marginBottom: 20 },
  loginBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold' },

  // Header Typography & Avatar
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  greetingTextContainer: { flex: 1 },
  greetingSubtitle: { fontSize: 15, color: '#8E8E93', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  greetingTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginVertical: 4 },
  departmentBadge: { color: '#007AFF', fontSize: 13, fontWeight: '600', backgroundColor: '#E0F0FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },

  // Metrics Overview Cards
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, marginHorizontal: 4, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#3A3A3C', fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // Section Headers
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 15 },

  // Actions Grid (Asymmetric Layout)
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', height: 180, marginBottom: 30 },
  actionButton: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4, justifyContent: 'space-between' },
  
  primaryAction: { flex: 1, backgroundColor: '#007AFF', marginRight: 12 },
  iconWrapperPrimary: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  actionTextPrimary: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginTop: 'auto' },
  actionSubtextPrimary: { fontSize: 13, color: '#E0F0FF', marginTop: 4 },

  secondaryActionsColumn: { flex: 1, justifyContent: 'space-between' },
  secondaryAction: { flex: 1, backgroundColor: '#FFFFFF', marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'flex-start', gap: 12 },
  iconWrapperSecondary: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  actionTextSecondary: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  actionSubtextSecondary: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // Bottom Informational Block
  recentActivityBox: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: '#3A3A3C' },
  activityText: { fontSize: 13, color: '#8E8E93', lineHeight: 20 },
});