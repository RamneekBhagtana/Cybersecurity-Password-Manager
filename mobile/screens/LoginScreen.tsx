import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) Alert.alert('Sign In Failed', error.message);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.shieldOuter}>
                        <View style={styles.shieldInner}>
                            <Ionicons name="checkmark" size={28} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.appName}>SecureVault</Text>
                </View>

                {/* Email Field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="jenna.k@email.com"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <Text style={styles.inputIcon}>✉</Text>
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { paddingRight: 44 }]}
                            placeholder="••••••••••"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.inputIcon}>🔒</Text>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotWrapper}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                    style={[styles.signInButton, loading && { opacity: 0.7 }]}
                    onPress={handleSignIn}
                    disabled={loading}
                >
                    <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                </TouchableOpacity>

                {/* Register Link */}
                <View style={styles.registerRow}>
                    <Text style={styles.registerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const PURPLE = '#6C63FF';
const BG = '#F0F2F8';

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BG,
    },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    shieldOuter: {
        width: 64,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    shieldInner: {
        width: 56,
        height: 64,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    checkmark: {
        fontSize: 24,
        color: '#22C55E',
        fontWeight: 'bold',
    },
    appName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a2e',
        letterSpacing: 0.5,
    },
    fieldGroup: {
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
    },
    inputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1a1a2e',
    },
    eyeButton: {
        position: 'absolute',
        right: 14,
        padding: 4,
    },
    eyeIcon: {
        fontSize: 16,
    },
    inputIcon: {
        fontSize: 16,
        marginTop: 6,
        marginLeft: 4,
        color: '#888',
    },
    forgotWrapper: {
        alignItems: 'flex-end',
        marginTop: 4,
        marginBottom: 28,
    },
    forgotText: {
        color: PURPLE,
        fontSize: 13,
        fontWeight: '600',
    },
    signInButton: {
        backgroundColor: PURPLE,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    signInText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        color: '#555',
        fontSize: 14,
    },
    registerLink: {
        color: PURPLE,
        fontSize: 14,
        fontWeight: '700',
    },
});