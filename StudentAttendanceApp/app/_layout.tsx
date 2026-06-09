import { Stack } from 'expo-router';
// ✅ FIXED: Corrected import package to 'expo-status-bar'
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './AppContext'; // Shared context state provider

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Keep both screens available to ensure stable layout unmounting */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          
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