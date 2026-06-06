import React, { createContext, useState, useContext } from 'react';

export interface Student {
  id: string;
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
  id: string;
  className: string;
  dateString: string;
  submissionTime: string;
  teacherName: string;
  teacherId: string;
  presentCount: number;
  totalStudents: number;
  studentsSnapshot: Student[]; // Contains deep copied student statuses at submission time
}

interface AppContextType {
  teachersList: Record<string, { profile: Teacher; securityPin: string }>;
  currentTeacher: Teacher | null;
  allStudentsData: Record<string, Student[]>;
  historyLogs: HistoryRecord[];
  setCurrentTeacher: (teacher: Teacher | null) => void;
  addNewStudent: (className: string, name: string, rollNumber: string) => void;
  updateAttendance: (className: string, studentId: string, status: 'Present' | 'Absent') => void;
  saveToHistoryLog: (className: string, date: Date) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TEACHERS_DATABASE: Record<string, { profile: Teacher; securityPin: string }> = {
  'teacher1@university.edu': {
    securityPin: '1111',
    profile: { id: 't1', name: 'Dr. Rajesh Kumar', email: 'teacher1@university.edu', department: 'Computer Science', employeeId: 'EMP-CSE-01', designation: 'HOD / Professor' }
  },
  'teacher2@university.edu': {
    securityPin: '2222',
    profile: { id: 't2', name: 'Prof. Anjali Sharma', email: 'teacher2@university.edu', department: 'AI & Machine Learning', employeeId: 'EMP-AIML-02', designation: 'Assistant Professor' }
  }
};

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
      [className]: prev[className].map((student) => (student.id === studentId ? { ...student, status } : student)),
    }));
  };

  const saveToHistoryLog = (className: string, date: Date) => {
    if (!currentTeacher) return;

    const currentClassRoster = allStudentsData[className] || [];
    const presentCount = currentClassRoster.filter(s => s.status === 'Present').length;
    const totalCount = currentClassRoster.length;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // CREATE A IMMUTABLE DEEP-COPY SNAPSHOT OF THE CURRENT STUDENT OBJECT ROSTER
    const deepCopiedSnapshot = currentClassRoster.map(student => ({ ...student }));

    const newLogEntry: HistoryRecord = {
      id: `log_${Date.now()}`,
      className,
      dateString: formattedDate,
      submissionTime: timestamp,
      teacherName: currentTeacher.name,
      teacherId: currentTeacher.id,
      presentCount,
      totalStudents: totalCount,
      studentsSnapshot: deepCopiedSnapshot
    };

    setHistoryLogs((prev) => [newLogEntry, ...prev]);

    // Wipe/Reset current workspace to default state parameters for future submissions
    setAllStudentsData((prev) => ({
      ...prev,
      [className]: prev[className].map(s => ({ ...s, status: 'Absent' }))
    }));
  };

  return (
    <AppContext.Provider value={{
      teachersList: TEACHERS_DATABASE,
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