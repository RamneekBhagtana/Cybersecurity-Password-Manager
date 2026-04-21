import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
    Clipboard,
    Alert,
    ActivityIndicator,
} from 'react-native';
import apiClient from '../lib/apiClient';

// ── Constants ─────────────────────────────────────────────────────
const PURPLE = '#6C63FF';
const BG = '#F0F2F8';

// ── Local fallback generator (used if backend is unreachable) ─────
function generatePasswordLocal(
    length: number,
    opts: { upper: boolean; lower: boolean; numbers: boolean; special: boolean }
): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let charset = '';
    if (opts.upper) charset += upper;
    if (opts.lower) charset += lower;
    if (opts.numbers) charset += numbers;
    if (opts.special) charset += special;
    if (!charset) charset = lower;

    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
}

// ── Strength calculator for displayed password ────────────────────
function getStrengthInfo(password: string): {
    label: string;
    color: string;
    score: number;
} {
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: '#EF4444', score: 1 };
    if (score === 2) return { label: 'Fair', color: '#F59E0B', score: 2 };
    if (score === 3) return { label: 'Good', color: '#84CC16', score: 3 };
    return { label: 'Very Strong — centuries to crack', color: '#22C55E', score: 4 };
}

// ─────────────────────────────────────────────────────────────────
export default function GeneratorScreen() {
    const [mode, setMode] = useState<'password' | 'passphrase'>('password');
    const [length, setLength] = useState(16);
    const [upper, setUpper] = useState(true);
    const [lower, setLower] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [special, setSpecial] = useState(true);
    const [password, setPassword] = useState('');
    const [generating, setGenerating] = useState(false);

    // ── Regenerate (via backend, with local fallback) ─────────
    const regenerate = useCallback(async () => {
        setGenerating(true);
        try {
            if (mode === 'password') {
                const res = await apiClient.post('/generator/password', {
                    length,
                    include_uppercase: upper,
                    include_lowercase: lower,
                    include_numbers: numbers,
                    include_symbols: special,
                });
                setPassword(res.data.password);
            } else {
                const res = await apiClient.post('/generator/passphrase', {
                    words: 4,
                    separator: '-',
                    capitalize: false,
                });
                setPassword(res.data.passphrase);
            }
        } catch (err) {
            // Backend unreachable - fall back to local generation
            console.warn('Backend generator failed, using local fallback');
            setPassword(
                generatePasswordLocal(length, { upper, lower, numbers, special })
            );
        } finally {
            setGenerating(false);
        }
    }, [length, upper, lower, numbers, special, mode]);

    // Generate initial password on mount and whenever mode changes
    useEffect(() => {
        regenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // ── Copy to clipboard ─────────────────────────────────────
    const handleCopy = () => {
        if (!password) return;
        Clipboard.setString(password);
        Alert.alert('Copied!', 'Password copied to clipboard.');
    };

    // ── Length adjustment ─────────────────────────────────────
    const adjustLength = (delta: number) => {
        const newLen = Math.min(32, Math.max(8, length + delta));
        setLength(newLen);
    };

    const strength = getStrengthInfo(password);

    // ── Render ────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.headerTitle}>Generator</Text>

                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
                        onPress={() => setMode('password')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.modeBtnText,
                                mode === 'password' && styles.modeBtnTextActive,
                            ]}
                        >
                            Password
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modeBtn,
                            mode === 'passphrase' && styles.modeBtnActive,
                        ]}
                        onPress={() => setMode('passphrase')}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.modeBtnText,
                                mode === 'passphrase' && styles.modeBtnTextActive,
                            ]}
                        >
                            Passphrase
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Generated Password Card */}
                <View style={styles.passwordCard}>
                    {generating ? (
                        <ActivityIndicator color={PURPLE} style={styles.passwordLoader} />
                    ) : (
                        <Text style={styles.passwordText} selectable>
                            {password}
                        </Text>
                    )}

                    {/* Strength bar */}
                    <View style={styles.strengthBarTrack}>
                        <View
                            style={[
                                styles.strengthBarFill,
                                {
                                    width: `${(strength.score / 4) * 100}%`,
                                    backgroundColor: strength.color,
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                        {strength.label}
                    </Text>

                    {/* Actions */}
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={handleCopy}
                            disabled={generating || !password}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.copyBtnText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.newBtn}
                            onPress={regenerate}
                            disabled={generating}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.newBtnText}>
                                {generating ? '...' : 'New'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Password Options (hide for passphrase mode) */}
                {mode === 'password' && (
                    <>
                        {/* Length */}
                        <View style={styles.settingCard}>
                            <View style={styles.lengthRow}>
                                <Text style={styles.settingLabel}>Length</Text>
                                <View style={styles.lengthControls}>
                                    <TouchableOpacity
                                        style={styles.lengthBtn}
                                        onPress={() => adjustLength(-1)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.lengthBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.lengthValue}>{length}</Text>
                                    <TouchableOpacity
                                        style={styles.lengthBtn}
                                        onPress={() => adjustLength(1)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.lengthBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Character Types */}
                        <View style={styles.settingCard}>
                            <View style={styles.switchRow}>
                                <Text style={styles.settingLabel}>Uppercase (A-Z)</Text>
                                <Switch
                                    value={upper}
                                    onValueChange={setUpper}
                                    trackColor={{ false: '#D1D5DB', true: PURPLE }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.switchRow}>
                                <Text style={styles.settingLabel}>Lowercase (a-z)</Text>
                                <Switch
                                    value={lower}
                                    onValueChange={setLower}
                                    trackColor={{ false: '#D1D5DB', true: PURPLE }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.switchRow}>
                                <Text style={styles.settingLabel}>Numbers (0-9)</Text>
                                <Switch
                                    value={numbers}
                                    onValueChange={setNumbers}
                                    trackColor={{ false: '#D1D5DB', true: PURPLE }}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.switchRow}>
                                <Text style={styles.settingLabel}>Symbols (!@#$)</Text>
                                <Switch
                                    value={special}
                                    onValueChange={setSpecial}
                                    trackColor={{ false: '#D1D5DB', true: PURPLE }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>

                        {/* Regenerate with current settings */}
                        <TouchableOpacity
                            style={styles.regenerateBtn}
                            onPress={regenerate}
                            disabled={generating}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.regenerateBtnText}>
                                {generating ? 'Generating...' : 'Regenerate Password'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Passphrase info card */}
                {mode === 'passphrase' && (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>About Passphrases</Text>
                        <Text style={styles.infoText}>
                            Passphrases combine random words separated by dashes.
                            They're easier to remember and just as secure as random
                            passwords. Tap "New" to generate a fresh one.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BG,
    },
    container: {
        padding: 20,
        paddingBottom: 100,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a2e',
        marginBottom: 16,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 9,
    },
    modeBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    modeBtnTextActive: {
        color: PURPLE,
    },
    passwordCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    passwordText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.5,
        fontFamily: 'Courier',
    },
    passwordLoader: {
        marginVertical: 20,
    },
    strengthBarTrack: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
    },
    copyBtn: {
        flex: 1,
        backgroundColor: BG,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    copyBtnText: {
        color: '#1a1a2e',
        fontWeight: '700',
        fontSize: 14,
    },
    newBtn: {
        flex: 1,
        backgroundColor: PURPLE,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    newBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    settingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    lengthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    lengthControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lengthBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lengthBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    lengthValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
        minWidth: 24,
        textAlign: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F2F8',
    },
    regenerateBtn: {
        backgroundColor: PURPLE,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    regenerateBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 4,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 19,
    },
});