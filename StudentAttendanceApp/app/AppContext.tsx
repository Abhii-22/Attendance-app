import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

// ✅ Matches your fixed computer Wi-Fi IP address
export const API_BASE_URL = 'http://192.168.1.9:5000/api';

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
  refreshStudentsList: () => void; // Added to let profile force a pull if needed
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// These will serve as fallback backups if a teacher has zero students enrolled yet
const DEFAULT_FALLBACK_ROSTER: Record<string, Student[]> = {
  'CSE A': [],
  'CSE B': [],
  'AIML': [],
  'ECE': [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student[]>>(DEFAULT_FALLBACK_ROSTER);
  const [historyLogs, setHistoryLogs] = useState<HistoryRecord[]>([]);

  // Function to pull students assigned to this teacher from MongoDB
  const fetchStudentsFromDatabase = (teacherId: string) => {
    // Assumes backend route structure: GET /api/students/teacher/:teacherId
    fetch(`${API_BASE_URL}/students/teacher/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.students) {
          // Group database array elements into our Class Name dictionary structures
          const groupedRoster: Record<string, Student[]> = {
            'CSE A': [],
            'CSE B': [],
            'AIML': [],
            'ECE': [],
          };

          data.students.forEach((student: any) => {
            const cls = student.assignedClass || 'CSE A';
            if (groupedRoster[cls]) {
              groupedRoster[cls].push({
                _id: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                status: 'Absent' // Default state for attendance marking workspace selection
              });
            }
          });
          setAllStudentsData(groupedRoster);
        }
      })
      .catch(err => console.error("Failed to fetch database student roster:", err));
  };

  // Synchronize system datasets automatically upon profile authentication change events
  useEffect(() => {
    if (currentTeacher) {
      // 1. Load History Logs
      fetch(`${API_BASE_URL}/history/${currentTeacher.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setHistoryLogs(data.logs);
        })
        .catch(err => console.error("Failed to fetch history logs:", err));

      // 2. Load Real Students from MongoDB
      fetchStudentsFromDatabase(currentTeacher.id);
    } else {
      setHistoryLogs([]);
      setAllStudentsData(DEFAULT_FALLBACK_ROSTER);
    }
  }, [currentTeacher]);

  const refreshStudentsList = () => {
    if (currentTeacher) fetchStudentsFromDatabase(currentTeacher.id);
  };

  const addNewStudent = (className: string, name: string, rollNumber: string, databaseId?: string) => {
    setAllStudentsData((prev) => {
      const currentClassList = prev[className] || [];
      const newStudent: Student = { 
        _id: databaseId, 
        id: `student_${Date.now()}`, 
        name, 
        rollNumber, 
        status: 'Absent' 
      };
      return { ...prev, [className]: [...currentClassList, newStudent] };
    });
  };

  const updateAttendance = (className: string, studentId: string, status: 'Present' | 'Absent') => {
    setAllStudentsData((prev) => ({
      ...prev,
      [className]: prev[className].map((student) => {
        const logUniqueId = student._id || student.id;
        return logUniqueId === studentId ? { ...student, status } : student;
      }),
    }));
  };

  const saveToHistoryLog = async (className: string, date: Date) => {
    if (!currentTeacher) return;

    const currentClassRoster = allStudentsData[className] || [];
    const presentCount = currentClassRoster.filter(s => s.status === 'Present').length;
    const totalCount = currentClassRoster.length;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const deepCopiedSnapshot = currentClassRoster.map(student => ({ 
      id: student.id,
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      status: student.status
    }));

    const logPayload = {
      className,
      dateString: formattedDate,
      submissionTime: timestamp,
      teacherName: currentTeacher.name,
      teacherId: currentTeacher.id,
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
        setHistoryLogs((prev) => [data.log, ...prev]);
        setAllStudentsData((prev) => ({
          ...prev,
          [className]: prev[className].map(s => ({ ...s, status: 'Absent' }))
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
      refreshStudentsList
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