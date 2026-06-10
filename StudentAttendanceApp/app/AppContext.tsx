import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

// ✅ Matches your fixed computer Wi-Fi IP address
export const API_BASE_URL = 'http://192.168.1.10:5000/api';

export interface Student {
  id?: string;
  _id?: string;
  name: string;
  rollNumber: string;
  status: 'Present' | 'Absent';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  employeeId: string;
  designation: string;
}

export interface HistoryRecord {
  id?: string;
  _id?: string;
  className: string;
  dateString: string;
  submissionTime: string;
  teacherName: string;
  teacherId: string;
  presentCount: number;
  totalStudents: number;
  studentsSnapshot: Student[];
}

interface AppContextType {
  currentTeacher: Teacher | null;
  allStudentsData: Record<string, Student[]>;
  historyLogs: HistoryRecord[];
  setCurrentTeacher: (teacher: Teacher | null) => void;
  addNewStudent: (className: string, name: string, rollNumber: string, databaseId?: string) => void;
  updateAttendance: (className: string, studentId: string, status: 'Present' | 'Absent') => void;
  saveToHistoryLog: (className: string, date: Date) => Promise<void>;
  refreshStudentsList: () => void; // Force refresh tool
  fetchHistoryLogsFromDatabase: (teacherId: string) => void; // Added to let screens update timeline instantly
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student[]>>({});
  const [historyLogs, setHistoryLogs] = useState<HistoryRecord[]>([]);

  // 📈 FUNCTION TO LOAD LOGS FROM MONGO DB INTO SCREEN MAPS
  const fetchHistoryLogsFromDatabase = (teacherId: string) => {
    fetch(`${API_BASE_URL}/history/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // ✅ FIX: Force clean fallback arrays to prevent screen data dropouts
          setHistoryLogs(data.logs || []);
          console.log(`📊 History synced cleanly from MongoDB: ${data.logs?.length || 0} logs.`);
        }
      })
      .catch(err => console.error("Failed to fetch history logs from MongoDB engine:", err));
  };

  // 📂 FUNCTION TO PULL REGISTERED STUDENTS ASSIGNED FROM EXCEL
  const fetchStudentsFromDatabase = (teacherId: string) => {
    fetch(`${API_BASE_URL}/students/teacher/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.students) {
          const groupedRoster: Record<string, Student[]> = {};

          data.students.forEach((student: any) => {
            // ✅ FIX: Dynamic property parsing safely handles whatever custom class name is uploaded
            const cls = (student.assignedClass || student.class || student.section || 'GENERAL').toString().toUpperCase().trim();
            
            if (!groupedRoster[cls]) {
              groupedRoster[cls] = [];
            }
            
            groupedRoster[cls].push({
              _id: student._id,
              id: student._id || `student_${Date.now()}_${Math.random()}`,
              name: student.name,
              rollNumber: student.rollNumber,
              status: 'Absent' 
            });
          });
          setAllStudentsData(groupedRoster);
        }
      })
      .catch(err => console.error("Failed to fetch database student roster:", err));
  };

  // Synchronize system datasets automatically upon profile authentication change events
  useEffect(() => {
    if (currentTeacher) {
      const activeTeacherId = currentTeacher.id || (currentTeacher as any)._id;
      // 1. Load Clean History Logs
      fetchHistoryLogsFromDatabase(activeTeacherId);
      // 2. Load Dynamic Students from MongoDB
      fetchStudentsFromDatabase(activeTeacherId);
    } else {
      setHistoryLogs([]);
      setAllStudentsData({});
    }
  }, [currentTeacher]);

  const refreshStudentsList = () => {
    if (currentTeacher) {
      const activeTeacherId = currentTeacher.id || (currentTeacher as any)._id;
      fetchStudentsFromDatabase(activeTeacherId);
    }
  };

  const addNewStudent = (className: string, name: string, rollNumber: string, databaseId?: string) => {
    const targetKey = className.toUpperCase().trim();
    setAllStudentsData((prev) => {
      const currentClassList = prev[targetKey] || [];
      const newStudent: Student = { 
        _id: databaseId,
        id: `student_${Date.now()}`,
        name,
        rollNumber,
        status: 'Absent'
      };
      return { ...prev, [targetKey]: [...currentClassList, newStudent] };
    });
  };

  const updateAttendance = (className: string, studentId: string, status: 'Present' | 'Absent') => {
    const targetKey = className.toUpperCase().trim();
    setAllStudentsData((prev) => ({
      ...prev,
      [targetKey]: (prev[targetKey] || []).map((student) => {
        const logUniqueId = student._id || student.id;
        return logUniqueId === studentId ? { ...student, status } : student;
      }),
    }));
  };

  const saveToHistoryLog = async (className: string, date: Date) => {
    if (!currentTeacher) return;

    const targetKey = className.toUpperCase().trim();
    const currentClassRoster = allStudentsData[targetKey] || [];
    const presentCount = currentClassRoster.filter(s => s.status === 'Present').length;
    const totalCount = currentClassRoster.length;

    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    const formattedDate = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

    const deepCopiedSnapshot = currentClassRoster.map(student => ({ 
      id: student.id || student._id,
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      status: student.status
    }));

    const activeTeacherId = currentTeacher.id || (currentTeacher as any)._id;

    const logPayload = {
      className: targetKey,
      dateString: formattedDate,
      submissionTime: timestamp,
      teacherName: currentTeacher.name,
      teacherId: activeTeacherId,
      presentCount,
      totalStudents: totalCount,
      studentsSnapshot: deepCopiedSnapshot
    };

    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ FIX: Instantly refresh the full logs array array directly from the database query
        fetchHistoryLogsFromDatabase(activeTeacherId);
        
        // Reset local workspace parameters back to default values
        setAllStudentsData((prev) => ({
          ...prev,
          [targetKey]: (prev[targetKey] || []).map(s => ({ ...s, status: 'Absent' }))
        }));
      } else {
        Alert.alert("Database Error", "Failed to save log to MongoDB.");
      }
    } catch (error) {
      console.error("Save Log Error:", error);
      Alert.alert("Network Error", "Could not reach the backend to save this log.");
    }
  };

  return (
    <AppContext.Provider value={{
      currentTeacher,
      allStudentsData,
      historyLogs,
      setCurrentTeacher,
      addNewStudent,
      updateAttendance,
      saveToHistoryLog,
      refreshStudentsList,
      fetchHistoryLogsFromDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppGlobalState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppGlobalState must be used within an AppProvider');
  return context;
}