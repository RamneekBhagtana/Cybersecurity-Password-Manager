import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';

// ── Strength calculator (same logic as RegisterScreen) ────────────
function getStrengthInfo(password: string): { label: string; color: string; score: number } {
    if (!password) return { label: '', color: '#E5E7EB', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score === 1) return { label: 'Weak', color: '#EF4444', score: 1 };
    if (score === 2) return { label: 'Fair', color: '#F59E0B', score: 2 };
    if (score === 3) return { label: 'Good', color: '#84CC16', score: 3 };
    return { label: 'Strong', color: '#22C55E', score: 4 };
}

// ─────────────────────────────────────────────────────────────────
export default function ChangePasswordScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const strength = getStrengthInfo(newPassword);

    const handleSave = async () => {
        if (!currentPassword.trim()) {
            Alert.alert('Required', 'Please enter your current password.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Too Short', 'New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'New password and confirmation do not match.');
            return;
        }
        if (newPassword === currentPassword) {
            Alert.alert('Same Password', 'Your new password must be different from your current one.');
            return;
        }

        setSaving(true);
        try {
            // Verify current password first via re-authentication
            const { data: userData } = await supabase.auth.getUser();
            const email = userData.user?.email;
            if (!email) throw new Error('Could not retrieve account email.');

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: currentPassword.trim(),
            });
            if (signInError) {
                Alert.alert('Incorrect Password', 'Your current password is incorrect.');
                return;
            }

            // Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) throw updateError;

            Alert.alert(
                'Password Updated',
                'Your account password has been changed successfully.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Failed to update password.');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = [
        styles.input,
        {
            backgroundColor: theme.inputBg,
            color: theme.text,
            borderColor: theme.border,
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: 48 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={[styles.backBtn, { color: theme.purple }]}>‹ Back</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.pageTitle, { color: theme.text }]}>Change Password</Text>
                    <Text style={[styles.pageSubtitle, { color: theme.placeholder }]}>
                        Update your account login password
                    </Text>

                    {/* Notice card */}
                    <View
                        style={[
                            styles.noticeCard,
                            {
                                backgroundColor: theme.isDark ? '#0a1520' : '#EFF6FF',
                                borderColor: theme.isDark ? '#1a2a3e' : '#BFDBFE',
                            },
                        ]}
                    >
                        <Ionicons name="information-circle" size={18} color={theme.isDark ? '#93C5FD' : '#1E40AF'} style={{ marginTop: 1 }} />
                        <Text style={[styles.noticeText, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                            This changes your SecureVault account password. Make sure to use a strong, unique password that you haven't used elsewhere.
                        </Text>
                    </View>

                    {/* Current password */}
                    <Text style={[styles.label, { color: theme.subtext }]}>CURRENT PASSWORD</Text>
                    <View style={[inputStyle, styles.rowInput]}>
                        <TextInput
                            style={[styles.rowField, { color: theme.text }]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter your current password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry={!showCurrent}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowCurrent(v => !v)}
                            style={styles.eyeBtn}
                        >
                            <Text style={{ fontSize: 16 }}>{showCurrent ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* New password */}
                    <Text style={[styles.label, { color: theme.subtext, marginTop: 16 }]}>NEW PASSWORD</Text>
                    <View style={[inputStyle, styles.rowInput]}>
                        <TextInput
                            style={[styles.rowField, { color: theme.text }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="At least 8 characters"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry={!showNew}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowNew(v => !v)}
                            style={styles.eyeBtn}
                        >
                            <Text style={{ fontSize: 16 }}>{showNew ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Strength bar */}
                    {newPassword.length > 0 && (
                        <View style={{ marginTop: 8, marginBottom: 4 }}>
                            <View style={styles.strengthTrack}>
                                {[1, 2, 3, 4].map(seg => (
                                    <View
                                        key={seg}
                                        style={[
                                            styles.strengthSeg,
                                            {
                                                backgroundColor:
                                                    strength.score >= seg
                                                        ? strength.color
                                                        : theme.border,
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

                    {/* Confirm password */}
                    <Text style={[styles.label, { color: theme.subtext, marginTop: 16 }]}>
                        CONFIRM NEW PASSWORD
                    </Text>
                    <View style={[inputStyle, styles.rowInput]}>
                        <TextInput
                            style={[styles.rowField, { color: theme.text }]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Re-enter new password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry={!showConfirm}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirm(v => !v)}
                            style={styles.eyeBtn}
                        >
                            <Text style={{ fontSize: 16 }}>{showConfirm ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Match indicator */}
                    {confirmPassword.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Ionicons
                                name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                                size={14}
                                color={newPassword === confirmPassword ? '#22C55E' : '#EF4444'}
                            />
                            <Text style={[styles.matchLabel, { color: newPassword === confirmPassword ? '#22C55E' : '#EF4444', marginTop: 0 }]}>
                                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                            </Text>
                        </View>
                    )}

                    {/* Save button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.purple }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.saveBtnText}>
                            {saving ? 'Updating…' : 'Update Password'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        marginBottom: 8,
    },
    backBtn: {
        fontSize: 17,
        fontWeight: '600',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    noticeCard: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 24,
    },
    noticeEmoji: {
        fontSize: 16,
        marginTop: 1,
    },
    noticeText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.4,
    },
    input: {
        borderRadius: 10,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    rowInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 0,
    },
    rowField: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
    },
    eyeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    strengthTrack: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    strengthSeg: {
        flex: 1,
        height: 5,
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    matchLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    saveBtn: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 28,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
