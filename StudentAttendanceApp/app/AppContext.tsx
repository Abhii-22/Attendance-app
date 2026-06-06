import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

// ⚠️ Ensure this matches your computer's IP address
const API_BASE_URL = 'http://192.168.1.10:5000/api';

export interface Student {
  id?: string;       // Local temporary ID
  _id?: string;      // MongoDB database ID
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
  addNewStudent: (className: string, name: string, rollNumber: string) => void;
  updateAttendance: (className: string, studentId: string, status: 'Present' | 'Absent') => void;
  saveToHistoryLog: (className: string, date: Date) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Temporary local roster until the Fetch Students API is fully integrated
const INITIAL_ROSTER: Record<string, Student[]> = {
  'CSE A': [
    { id: 'c1_1', name: 'Arjun Sharma', rollNumber: 'CSE-A-01', status: 'Absent' },
    { id: 'c1_2', name: 'Neha Patel', rollNumber: 'CSE-A-02', status: 'Present' },
  ],
  'CSE B': [{ id: 'c2_1', name: 'Rahul Verma', rollNumber: 'CSE-B-01', status: 'Present' }],
  'AIML': [{ id: 'aiml_1', name: 'Vikram Malhotra', rollNumber: 'AIML-01', status: 'Present' }],
  'ECE': [{ id: 'ece_1', name: 'Gautam Pillai', rollNumber: 'ECE-01', status: 'Absent' }],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student[]>>(INITIAL_ROSTER);
  const [historyLogs, setHistoryLogs] = useState<HistoryRecord[]>([]);

  // Automatically fetch this teacher's history logs from MongoDB when they log in
  useEffect(() => {
    if (currentTeacher) {
      fetch(`${API_BASE_URL}/history/${currentTeacher.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setHistoryLogs(data.logs);
          }
        })
        .catch(err => console.error("Failed to fetch history logs:", err));
    } else {
      setHistoryLogs([]); // Clear logs if they log out
    }
  }, [currentTeacher]);

  const addNewStudent = (className: string, name: string, rollNumber: string) => {
    setAllStudentsData((prev) => {
      const currentClassList = prev[className] || [];
      const newStudent: Student = { id: `student_${Date.now()}`, name, rollNumber, status: 'Absent' };
      return { ...prev, [className]: [...currentClassList, newStudent] };
    });
  };

  const updateAttendance = (className: string, studentId: string, status: 'Present' | 'Absent') => {
    setAllStudentsData((prev) => ({
      ...prev,
      [className]: prev[className].map((student) => {
        // Match against either local ID or database _id
        const logUniqueId = student._id || student.id;
        return logUniqueId === studentId ? { ...student, status } : student;
      }),
    }));
  };

  // Sends the snapshot to MongoDB
  const saveToHistoryLog = async (className: string, date: Date) => {
    if (!currentTeacher) return;

    const currentClassRoster = allStudentsData[className] || [];
    const presentCount = currentClassRoster.filter(s => s.status === 'Present').length;
    const totalCount = currentClassRoster.length;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Create the deep-copy snapshot
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
      // 1. Send the log to the Node.js Backend
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 2. Add the newly saved DB record (which now has a MongoDB _id) to our local screen
        setHistoryLogs((prev) => [data.log, ...prev]);

        // 3. Reset the workspace roster back to 'Absent' defaults
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
      saveToHistoryLog
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