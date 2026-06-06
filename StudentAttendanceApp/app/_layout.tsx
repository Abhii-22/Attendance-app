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
          {/* Main Group Interface Tab Navigator Entry */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Isolated Auth Routes Screen */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          
          {/* Overlaid Alerts Information Modals */}
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