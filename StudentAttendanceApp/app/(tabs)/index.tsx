import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppGlobalState } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';
// ✅ IMPORT useFocusEffect TO LISTEN TO TAB FOCUS TRANSITIONS
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  // ✅ Extracted refreshStudentsList from your global state context to force local state refreshes
  const { currentTeacher, allStudentsData, historyLogs, refreshStudentsList } = useAppGlobalState();

  // ✅ INSTANT AUTOMATIC UPDATE FIX:
  // Runs every single time the teacher switches onto the Home Tab view.
  // It pulls fresh data into 'allStudentsData' so the counts update instantly!
  useFocusEffect(
    useCallback(() => {
      if (typeof refreshStudentsList === 'function') {
        refreshStudentsList();
      }
    }, [])
  );

  // 🔒 ONLY CHANGE: Premium visual restyling of the unauthenticated terminal view
  if (!currentTeacher) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Minimal Subtle Header Ribbon */}
        <View style={styles.fallbackHeaderNavbar}>
          <Text style={styles.fallbackHeaderMainTitle}>Attendance App</Text>
          <View style={styles.livePulseIndicator}>
            <View style={styles.pulseDotCore} />
          </View>
        </View>

        {/* High-End Card Layout Panel */}
        <View style={styles.fallbackCenterContainer}>
          <View style={styles.illustrationCardContainer}>
            
            {/* Security Shield Clock Icon Arrangement */}
            <View style={styles.shieldDecorationCircle}>
              <Ionicons name="time-outline" size={38} color="#FF9500" />
              <View style={styles.miniAlertBadge}>
                <Ionicons name="alert" size={10} color="#FFF" />
              </View>
            </View>

            {/* Structured Text Content */}
            <Text style={styles.mainStateHeadline}>Session Expired</Text>
            <Text style={styles.stateParagraphDescription}>
              For your account security, your connection timed out due to inactivity. Please log back in to manage active datasets.
            </Text>

            {/* CTA Dynamic Button Trigger */}
            <TouchableOpacity 
              style={styles.actionReturnButton}
              onPress={() => router.replace('/login')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionReturnButtonText}>Go to Login</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Security Stamp Description */}
        <Text style={styles.footerSecurityBadgeText}>
          🔒 Secure Gateway Authentication System
        </Text>
      </SafeAreaView>
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
        
        {/* 🏢 STRUCTURE PANEL 1: PROFILE HERO HEADER */}
        <View style={styles.profileHeroSection}>
          <View style={styles.heroLeft}>
            <Text style={styles.greetingSubtitle}>{greeting},</Text>
            <Text style={styles.greetingTitle}>{currentTeacher.name}</Text>
            <View style={styles.departmentBadge}>
              <Ionicons name="business" size={12} color="#007AFF" style={{ marginRight: 4 }} />
              <Text style={styles.departmentBadgeText}>{currentTeacher.department}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>
              {currentTeacher.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📊 STRUCTURE PANEL 2: INTEGRATED QUICK-METRIC STRIP */}
        <View style={styles.metricsWrapperCard}>
          <Text style={styles.cardHeaderLabel}>DEPARTMENT SNAPSHOT</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F0FF' }]}>
                <Ionicons name="people" size={18} color="#007AFF" />
              </View>
              <Text style={styles.statNumber}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            
            <View style={styles.dividerLine} />

            <View style={styles.statItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#E4F9E9' }]}>
                <Ionicons name="library" size={18} color="#34C759" />
              </View>
              <Text style={styles.statNumber}>{totalClasses}</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.statItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#F4E8FF' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#AF52DE" />
              </View>
              <Text style={styles.statNumber}>{myRecentLogs}</Text>
              <Text style={styles.statLabel}>Logs</Text>
            </View>
          </View>
        </View>

        {/* 🚀 STRUCTURE PANEL 3: THE HIGH-PRIORITY BALANCED NAVIGATION BLOCK */}
        <Text style={styles.sectionTitle}>Main Workspace Actions</Text>
        
        {/* Row 1: Split-Action Layout */}
        <View style={styles.actionRowGrid}>
          <TouchableOpacity style={[styles.gridBlockAction, { borderLeftColor: '#007AFF' }]} onPress={() => router.push('/(tabs)/attendance')}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#E0F0FF' }]}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
            </View>
            <Text style={styles.gridActionTitle}>Take Attendance</Text>
            <Text style={styles.gridActionDesc}>Submit today's roll call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridBlockAction, { borderLeftColor: '#FF9500' }]} onPress={() => router.push('/(tabs)/analytics')}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#FFF2E0' }]}>
              <Ionicons name="pie-chart" size={20} color="#FF9500" />
            </View>
            <Text style={styles.gridActionTitle}>Analytics Engine</Text>
            <Text style={styles.gridActionDesc}>Check user percentages</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Split-Action Layout */}
        <View style={styles.actionRowGrid}>
          <TouchableOpacity style={[styles.gridBlockAction, { borderLeftColor: '#34C759' }]} onPress={() => router.push('/(tabs)/history')}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#E4F9E9' }]}>
              <Ionicons name="time" size={20} color="#34C759" />
            </View>
            <Text style={styles.gridActionTitle}>Log History</Text>
            <Text style={styles.gridActionDesc}>Review old database archives</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridBlockAction, { borderLeftColor: '#AF52DE' }]} onPress={() => router.push('/(tabs)/profile')}>
            <View style={[styles.actionIconBadge, { backgroundColor: '#F4E8FF' }]}>
              <Ionicons name="person-add" size={20} color="#AF52DE" />
            </View>
            <Text style={styles.gridActionTitle}>Roster Import</Text>
            <Text style={styles.gridActionDesc}>Excel upload or session settings</Text>
          </TouchableOpacity>
        </View>

        {/* ℹ️ STRUCTURE PANEL 4: STATUS FOOTER CONTAINER */}
        <View style={styles.recentActivityBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.activityText}>All systems operational. Ensure all logs are submitted daily.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 16 },
  
  // Panel 1: Profile Structural Cards
  profileHeroSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  heroLeft: { flex: 1 },
  greetingSubtitle: { fontSize: 12, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  greetingTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 2 },
  departmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  departmentBadgeText: { color: '#48484A', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Panel 2: Integrated Metric Cards Block
  metricsWrapperCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  cardHeaderLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '700', letterSpacing: 1, marginBottom: 14, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  iconCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  dividerLine: { width: 1, height: 40, backgroundColor: '#E5E5EA' },

  // Panel 3: Balanced 2x2 Grid Blocks
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#636366', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingLeft: 4 },
  actionRowGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridBlockAction: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  actionIconBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridActionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  gridActionDesc: { fontSize: 11, color: '#8E8E93', marginTop: 3, fontWeight: '500', lineHeight: 14 },

  // Panel 4: Footer Activity Info Block
  recentActivityBox: { backgroundColor: '#FFF', padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E5E5EA', marginTop: 6 },
  activityText: { color: '#666', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 16 },

  // 🔒 MODERN SECURITY GATEKEEPER FALLBACK DESIGN STYLES
  fallbackHeaderNavbar: { height: 60, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#E5E5EA' },
  fallbackHeaderMainTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  livePulseIndicator: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center' },
  pulseDotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  fallbackCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  illustrationCardContainer: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 24, paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  shieldDecorationCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFF9F0', justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#FFEAA7' },
  miniAlertBadge: { position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF9500', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  mainStateHeadline: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 8 },
  stateParagraphDescription: { fontSize: 13, color: '#8E8E93', fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10, marginBottom: 24 },
  actionReturnButton: { backgroundColor: '#007AFF', flexDirection: 'row', height: 46, width: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  actionReturnButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  footerSecurityBadgeText: { textAlign: 'center', color: '#C7C7CC', fontSize: 11, fontWeight: '600', marginBottom: 16, letterSpacing: 0.2 }
});