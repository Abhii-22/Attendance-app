import { StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.modalTitle}>System Broadcast</Text>
      <Text style={styles.modalBody}>
        Final semester records updates are finalizing tonight. Please verify all logged entries match your instructor checklists.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 24, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12 },
  modalBody: { fontSize: 16, color: '#3A3A3C', textAlign: 'center', lineHeight: 22 }
});