import { StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Performance Tracker</Text>
      <View style={styles.metricBox}>
        <Text style={styles.metricTitle}>Overall Attendance Rate</Text>
        <Text style={styles.metricNumber}>88.5%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20, justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 20, textAlign: 'center' },
  metricBox: { backgroundColor: '#007AFF', padding: 30, borderRadius: 16, alignItems: 'center' },
  metricTitle: { color: '#E0F0FF', fontSize: 16, fontWeight: '500' },
  metricNumber: { color: '#FFF', fontSize: 48, fontWeight: 'bold', marginTop: 10 }
});