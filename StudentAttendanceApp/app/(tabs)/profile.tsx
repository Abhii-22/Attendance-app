import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppGlobalState, API_BASE_URL } from '../AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
// ✅ IMPORT THE ROUTER CONTEXT FOR CLEAN IMPERATIVE JUMPS
import { router } from 'expo-router';

export default function StudentImportScreen() {
  const { currentTeacher, setCurrentTeacher } = useAppGlobalState();
  
  // Section States
  const [newSectionInput, setNewSectionInput] = useState('');
  const [customSections, setCustomSections] = useState<string[]>([]); 
  const [selectedSection, setSelectedSection] = useState('');
  
  // File States
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ SAFELY REDIRECTS FIRST, THEN CLEARS CONTEXT
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of your session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: () => {
            // 1. Kick the user out to the login screen first while the tabs are still mounted
            router.replace('/login');
            
            // 2. Clear state inside the next micro-task loop to prevent Fabric renderer crashes
            setTimeout(() => {
              if (typeof setCurrentTeacher === 'function') {
                setCurrentTeacher(null);
              }
            }, 100);
          } 
        }
      ]
    );
  };

  // MANUALLY ADD CUSTOM SECTIONS TO THE INPUT OPTIONS LIST
  const handleAddCustomSection = () => {
    const cleanInput = newSectionInput.trim().toUpperCase();
    if (!cleanInput) {
      Alert.alert("Empty Input", "Please type a section name first (e.g., ECE A).");
      return;
    }
    if (customSections.includes(cleanInput)) {
      Alert.alert("Duplicate", "This section option already exists.");
      return;
    }
    setCustomSections([...customSections, cleanInput]);
    setSelectedSection(cleanInput); 
    setNewSectionInput('');
  };

  // 📂 PARSE EXCEL / CSV SPREADSHEET AUTOMATICALLY
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv', // .csv
          'text/comma-separated-values'
        ],
        copyToCacheDirectory: true
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      const lowerName = asset.name.toLowerCase();
      setFileName(asset.name);

      const response = await fetch(asset.uri);
      
      if (lowerName.endsWith('.csv')) {
        const textData = await response.text();
        const workbook = XLSX.read(textData, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonOutput = XLSX.utils.sheet_to_json(worksheet);
        
        setParsedData(jsonOutput);
        Alert.alert("CSV File Parsed", `Found ${jsonOutput.length} data rows inside sheet successfully.`);
      } else {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const dataUrl = e.target.result;
            const base64Data = dataUrl.split(',')[1];
            
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonOutput = XLSX.utils.sheet_to_json(worksheet);
            
            setParsedData(jsonOutput);
            Alert.alert("Excel File Parsed", `Found ${jsonOutput.length} data rows inside sheet successfully.`);
          } catch (parseError) {
            console.error("Workbook compile error:", parseError);
            Alert.alert("Error Parsing", "Could not map spreadsheet columns. Make sure the file is not corrupted.");
          }
        };
        reader.readAsDataURL(blob);
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Parser Error", "Failed to decode spreadsheet contents accurately.");
    }
  };

  // 🚀 EXECUTE BULK TRANSFERS TO MONGODB
  const handleUploadDatabase = async () => {
    if (!selectedSection) {
      Alert.alert("Selection Required", "Please tap and select a target section option from your list above.");
      return;
    }
    if (parsedData.length === 0) {
      Alert.alert("No Data Source", "Please attach a valid, populated spreadsheet file first.");
      return;
    }

    setIsUploading(true);

    try {
      const standardizedSection = selectedSection.toString().trim().toUpperCase().replace(/\s+/g, '');

      const formattedStudents = parsedData.map((row: any) => {
        const rawName = row.Name || row.name || row["Student Name"] || row["Name "];
        const rawRoll = row.RollNumber || row.rollNumber || row["Roll Number"] || row.Roll_Number;
        
        if (!rawName || !rawRoll) return null;

        const cleanRoll = rawRoll.toString().trim();
        const suffix = `-${standardizedSection}`;
        
        return {
          name: rawName.toString().trim(),
          rollNumber: cleanRoll.endsWith(suffix) ? cleanRoll : `${cleanRoll}${suffix}`
        };
      }).filter(Boolean);

      if (formattedStudents.length === 0) {
        Alert.alert("Parsing Mismatch", "Could not read data. Ensure your headers are exactly 'Name' and 'RollNumber'.");
        setIsUploading(false);
        return;
      }

      const verifiedTeacherId = currentTeacher ? ('id' in currentTeacher ? currentTeacher.id : (currentTeacher as any)._id) : '';

      const response = await fetch(`${API_BASE_URL}/admin/students/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: selectedSection,
          students: formattedStudents,
          teacherId: verifiedTeacherId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          "Import Completed 🎉",
          `• Section: ${selectedSection}\n• Successfully Added: ${data.importedCount} Students\n• Duplicate Skips: ${data.duplicateCount}`,
          [{ text: "Awesome" }]
        );
        setFileName('');
        setParsedData([]);
      } else {
        Alert.alert("Upload Failed", data.message || "Failed processing calculation collections.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not talk to backend server.");
    } finally {
      setIsUploading(false);
    }
  };

  // Safe Fallback
  if (!currentTeacher) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ fontWeight: '600', color: '#8E8E93' }}>Signed out successfully.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TEACHER PROFILE INFO HEADER CARD */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#007AFF" />
          </View>
          <View style={styles.profileMetaInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.teacherNameText}>
                {currentTeacher?.name || "Instructor Account"}
              </Text>
              
              {/* LOGOUT TOUCHABLE ICON */}
              <TouchableOpacity onPress={handleLogout} activeOpacity={0.6} style={{ padding: 4 }}>
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.teacherRankText}>
              {currentTeacher?.designation || "Academic Faculty Rank"}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.deptBadge}>
                <Text style={styles.badgeText}>Dept: {currentTeacher?.department || "N/A"}</Text>
              </View>
              <View style={styles.idBadge}>
                <Text style={styles.badgeText}>ID: {(currentTeacher as any)?.employeeId || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeadingTitle}>📊 Excel Student Enroller</Text>
        <Text style={styles.subTitle}>Manually create your target sections, select the active folder options, and upload your student roster sheet.</Text>

        {/* 1. SECTION CONFIGURATOR WORKSPACE */}
        <View style={styles.card}>
          <Text style={styles.label}>1. Add Section Input Manually</Text>
          <View style={styles.inlineFormRow}>
            <TextInput 
              style={styles.inlineInput}
              placeholder="e.g., CSE C, AIML B, ME"
              value={newSectionInput}
              onChangeText={setNewSectionInput}
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomSection}>
              <Ionicons name="add" size={22} color="#FFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.miniLabel}>Select Target Class Options:</Text>
          <View style={styles.chipClusterContainer}>
            {customSections.length === 0 ? (
              <Text style={styles.noSectionsHint}>No sections added yet. Type above to add one.</Text>
            ) : (
              customSections.map((sect) => {
                const isSelected = selectedSection === sect;
                return (
                  <TouchableOpacity 
                    key={sect}
                    style={[styles.chip, isSelected && styles.activeChip]}
                    onPress={() => setSelectedSection(sect)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{sect}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{marginLeft: 4}} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* 2. FILE SOURCE ACCESS ATTACHMENT PANEL */}
        <View style={styles.card}>
          <Text style={styles.label}>2. Select Spreadsheet File</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={handlePickDocument}>
            <Ionicons name="document-text-outline" size={26} color="#007AFF" />
            <Text style={styles.pickerBtnText}>
              {fileName ? fileName : "Attach Spreadsheet File (.xlsx, .csv)"}
            </Text>
          </TouchableOpacity>

          {parsedData.length > 0 && (
            <Text style={styles.recordCounterIndicator}>
              ✅ Verified: <Text style={{fontWeight:'700'}}>{parsedData.length}</Text> students matching row patterns parsed.
            </Text>
          )}
        </View>

        {/* 3. FINAL BACKEND DISPATCH TRIGGER */}
        <TouchableOpacity 
          style={[
            styles.uploadBtn,
            (!selectedSection || parsedData.length === 0 || isUploading) && styles.uploadBtnDisabled
          ]} 
          onPress={handleUploadDatabase}
          disabled={!selectedSection || parsedData.length === 0 || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#FFF" style={{marginRight: 6}} />
              <Text style={styles.uploadBtnText}>
                {selectedSection ? `Upload Roster to ${selectedSection}` : 'Select Section to Upload'}
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeaderCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 20 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  profileMetaInfo: { flex: 1 },
  teacherNameText: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  teacherRankText: { fontSize: 13, color: '#666', fontWeight: '500', marginTop: 2, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  deptBadge: { backgroundColor: '#E4F9E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  idBadge: { backgroundColor: '#F4E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#333' },
  sectionHeadingTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  subTitle: { fontSize: 13, color: '#8E8E93', lineHeight: 18, marginBottom: 22 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.4 },
  miniLabel: { fontSize: 12, fontWeight: '600', color: '#1C1C1E', marginTop: 15, marginBottom: 8 },
  inlineFormRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inlineInput: { flex: 1, backgroundColor: '#F2F2F7', height: 44, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  addBtn: { backgroundColor: '#007AFF', height: 44, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  chipClusterContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D1D1D6', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center' },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  activeChipText: { color: '#FFF' },
  noSectionsHint: { fontSize: 13, color: '#8E8E93', fontStyle: 'italic', marginTop: 4 },
  pickerBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#007AFF', borderRadius: 10, backgroundColor: '#F4F9FF', height: 100, justifyContent: 'center', alignItems: 'center', gap: 6 },
  pickerBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '600', paddingHorizontal: 15, textAlign: 'center' },
  recordCounterIndicator: { fontSize: 12, color: '#34C759', marginTop: 10, textAlign: 'center', fontWeight: '500' },
  uploadBtn: { backgroundColor: '#34C759', height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  uploadBtnDisabled: { backgroundColor: '#A2E8B1' },
  uploadBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});