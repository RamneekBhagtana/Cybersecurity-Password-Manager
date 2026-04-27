import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSession } from './hooks/useSession';
import { View, Text } from 'react-native';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import VaultScreen from './screens/VaultScreen';
import GeneratorScreen from './screens/GeneratorScreen';
import ProfileScreen from './screens/ProfileScreen';
import SecurityReportsScreen from './screens/SecurityReportsScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';

// ── Navigation param types ────────────────────────────────────────
export type RootStackParamList = {
    Main: undefined;
    SecurityReports: undefined;
    ChangePassword: undefined;
};

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator();

// ── Auth navigator ────────────────────────────────────────────────
function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

// ── Main tab navigator ────────────────────────────────────────────
// headerShown: false removes the duplicate screen title at the top —
// each screen renders its own header inside SafeAreaView.
function MainNavigator() {
    const { theme } = useTheme();
    return (
        <MainTab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.tabBarBorder,
                },
                tabBarActiveTintColor: theme.purple,
                tabBarInactiveTintColor: theme.placeholder,
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
                        Vault:     { active: 'lock-closed',  inactive: 'lock-closed-outline' },
                        Generator: { active: 'key',          inactive: 'key-outline' },
                        Profile:   { active: 'person',       inactive: 'person-outline' },
                    };
                    const { active, inactive } = icons[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
                    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
                },
            })}
        >
            <MainTab.Screen name="Vault" component={VaultScreen} />
            <MainTab.Screen name="Generator" component={GeneratorScreen} />
            <MainTab.Screen name="Profile" component={ProfileScreen} />
        </MainTab.Navigator>
    );
}

// ── Root stack (tabs + modal screens) ────────────────────────────
function RootNavigator() {
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
                name="SecurityReports"
                component={SecurityReportsScreen}
                options={{ presentation: 'modal' }}
            />
            <RootStack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ presentation: 'modal' }}
            />
        </RootStack.Navigator>
    );
}

// ── Inner app (reads session, picks navigator) ────────────────────
function AppContent() {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Loading…</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {session ? <RootNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}

// ── Root export — wraps everything in ThemeProvider ───────────────
export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
