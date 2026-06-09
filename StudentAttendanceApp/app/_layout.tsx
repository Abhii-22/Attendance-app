import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './AppContext'; // Shared context state provider

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Core App Screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          
          {/* ✅ Editable Admin Interface */}
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          
          {/* ✅ Standalone Read-Only Monitor Interface */}
          <Stack.Screen name="adminview" options={{ headerShown: false }} />
          
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              headerShown: true, 
              title: 'System Information' 
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </AppProvider>
  );
}