import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSession } from './hooks/useSession';
import { View, Text } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import VaultScreen from './screens/VaultScreen';
import GeneratorScreen from './screens/GeneratorScreen';
import ProfileScreen from './screens/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

function MainNavigator() {
    return (
        <MainTab.Navigator>
            <MainTab.Screen name="Vault" component={VaultScreen} />
            <MainTab.Screen name="Generator" component={GeneratorScreen} />
            <MainTab.Screen name="Profile" component={ProfileScreen} />
        </MainTab.Navigator>
    );
}

export default function App() {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {session ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}