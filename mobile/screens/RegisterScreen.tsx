import { useState } from 'react';
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

function getStrength(password: string): { score: number; label: string; color: string } {
    if (password.length === 0) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak — add uppercase & numbers', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Fair — add special characters', color: '#F59E0B' };
    if (score === 3) return { score: 3, label: 'Good — almost there!', color: '#84CC16' };
    return { score: 4, label: 'Strong — great password!', color: '#22C55E' };
}

export default function RegisterScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const strength = getStrength(password);

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) {
            Alert.alert('Registration Failed', error.message);
        } else {
            Alert.alert('Success', 'Check your email to confirm your account.');
            navigation.navigate('Login');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Back Button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>

                {/* Header */}
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start managing your passwords securely</Text>

                {/* Email */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="you@email.com"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { paddingRight: 44 }]}
                            placeholder="Min. 8 characters"
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

                    {/* Strength Bar */}
                    {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBarRow}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.strengthSegment,
                                            {
                                                backgroundColor:
                                                    i <= strength.score
                                                        ? strength.color
                                                        : '#E5E7EB',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength.color }]}>
                                {strength.label}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { paddingRight: 44 }]}
                            placeholder="Re-enter password"
                            placeholderTextColor="#aaa"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirm}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirm(!showConfirm)}
                        >
                            <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Create Account Button */}
                <TouchableOpacity
                    style={[styles.createButton, loading && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={styles.createButtonText}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
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
        paddingTop: 20,
    },
    backButton: {
        marginBottom: 20,
        marginTop: 8,
    },
    backIcon: {
        fontSize: 28,
        color: '#1a1a2e',
        fontWeight: '300',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a2e',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        marginBottom: 28,
    },
    fieldGroup: {
        marginBottom: 16,
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
    strengthContainer: {
        marginTop: 8,
    },
    strengthBarRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    strengthSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: PURPLE,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: '#555',
        fontSize: 14,
    },
    loginLink: {
        color: PURPLE,
        fontSize: 14,
        fontWeight: '700',
    },
});