import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import apiClient from '../lib/apiClient';
import { useTheme } from '../lib/ThemeContext';

// ── Local fallback generator ──────────────────────────────────────
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

// ── Strength calculator ───────────────────────────────────────────
function getStrengthInfo(password: string): { label: string; color: string; score: number } {
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

// ── Passphrase quick-select separators ────────────────────────────
const QUICK_SEPS = ['-', '_', '.', '!', '@', '#', '*'];

// ─────────────────────────────────────────────────────────────────
export default function GeneratorScreen() {
    const { theme } = useTheme();
    const PURPLE = theme.purple;
    const BG = theme.bg;

    const [mode, setMode] = useState<'password' | 'passphrase'>('password');
    const [length, setLength] = useState(16);
    const [upper, setUpper] = useState(true);
    const [lower, setLower] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [special, setSpecial] = useState(true);
    const [separator, setSeparator] = useState('-');
    const [customSep, setCustomSep] = useState('');
    const [password, setPassword] = useState('');
    const [generating, setGenerating] = useState(false);

    // ── Guard: prevent disabling the last active character type ───
    const countActive = () =>
        [upper, lower, numbers, special].filter(Boolean).length;

    const tryToggle = (
        setter: (v: boolean) => void,
        newVal: boolean
    ) => {
        if (!newVal && countActive() === 1) {
            Alert.alert(
                'Cannot Disable',
                'At least one character type must remain selected — a password cannot be generated with no characters.'
            );
            return;
        }
        setter(newVal);
    };

    // ── Generate (backend with local fallback) ────────────────
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
                const sep = customSep.trim() || separator;
                const res = await apiClient.post('/generator/passphrase', {
                    words: 4,
                    separator: sep,
                    capitalize: false,
                });
                setPassword(res.data.passphrase);
            }
        } catch {
            // Backend unreachable — fall back to local generation
            setPassword(
                generatePasswordLocal(length, { upper, lower, numbers, special })
            );
        } finally {
            setGenerating(false);
        }
    }, [length, upper, lower, numbers, special, mode, separator, customSep]);

    // Generate on mount and when mode changes
    useEffect(() => {
        regenerate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // ── Copy ──────────────────────────────────────────────────
    const handleCopy = async () => {
        if (!password) return;
        await Clipboard.setStringAsync(password);
        Alert.alert('Copied!', 'Password copied to clipboard.');
    };

    // ── Length control ────────────────────────────────────────
    const adjustLength = (delta: number) =>
        setLength(l => Math.min(32, Math.max(8, l + delta)));

    const strength = getStrengthInfo(password);

    // ── Render ────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={[styles.headerTitle, { color: theme.text }]}>Generator</Text>

                {/* Mode toggle */}
                <View style={[styles.modeToggle, { backgroundColor: theme.isDark ? '#1a1a2e' : '#E5E7EB' }]}>
                    {(['password', 'passphrase'] as const).map(m => (
                        <TouchableOpacity
                            key={m}
                            style={[
                                styles.modeBtn,
                                mode === m && [
                                    styles.modeBtnActive,
                                    { backgroundColor: theme.card },
                                ],
                            ]}
                            onPress={() => setMode(m)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.modeBtnText,
                                    { color: theme.placeholder },
                                    mode === m && { color: PURPLE },
                                ]}
                            >
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Password card */}
                <View style={[styles.passwordCard, { backgroundColor: theme.card }]}>
                    {generating ? (
                        <ActivityIndicator color={PURPLE} style={styles.passwordLoader} />
                    ) : (
                        <Text style={[styles.passwordText, { color: theme.text }]} selectable>
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
                            style={[styles.copyBtn, { backgroundColor: BG }]}
                            onPress={handleCopy}
                            disabled={generating || !password}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.copyBtnText, { color: theme.text }]}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.newBtn, { backgroundColor: PURPLE }]}
                            onPress={regenerate}
                            disabled={generating}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.newBtnText}>
                                {generating ? '…' : 'New'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Password options ─────────────────────────────── */}
                {mode === 'password' && (
                    <>
                        {/* Length */}
                        <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                            <View style={styles.lengthRow}>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Length</Text>
                                <View style={styles.lengthControls}>
                                    <TouchableOpacity
                                        style={[styles.lengthBtn, { backgroundColor: BG }]}
                                        onPress={() => adjustLength(-1)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.lengthBtnText, { color: theme.text }]}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.lengthValue, { color: theme.text }]}>{length}</Text>
                                    <TouchableOpacity
                                        style={[styles.lengthBtn, { backgroundColor: BG }]}
                                        onPress={() => adjustLength(1)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.lengthBtnText, { color: theme.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Character types */}
                        <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                            {[
                                { label: 'Uppercase (A-Z)', value: upper, setter: setUpper },
                                { label: 'Lowercase (a-z)', value: lower, setter: setLower },
                                { label: 'Numbers (0-9)', value: numbers, setter: setNumbers },
                                { label: 'Symbols (!@#$)', value: special, setter: setSpecial },
                            ].map(({ label, value, setter }, idx, arr) => (
                                <View key={label}>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.settingLabel, { color: theme.text }]}>
                                            {label}
                                        </Text>
                                        <Switch
                                            value={value}
                                            onValueChange={v => tryToggle(setter, v)}
                                            trackColor={{ false: theme.border, true: PURPLE }}
                                            thumbColor="#fff"
                                        />
                                    </View>
                                    {idx < arr.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── Passphrase options ───────────────────────────── */}
                {mode === 'passphrase' && (
                    <>
                        {/* Separator picker */}
                        <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
                            {/* Header row: label + live preview */}
                            <View style={styles.sepHeaderRow}>
                                <Text style={[styles.settingLabel, { color: theme.text }]}>
                                    Word Separator
                                </Text>
                                <View style={[styles.sepPreview, { backgroundColor: PURPLE + '18' }]}>
                                    <Text style={[styles.sepPreviewWord, { color: theme.subtext }]}>word</Text>
                                    <Text style={[styles.sepPreviewChar, { color: PURPLE }]}>
                                        {customSep.trim() || separator}
                                    </Text>
                                    <Text style={[styles.sepPreviewWord, { color: theme.subtext }]}>word</Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.divider, marginBottom: 12 }]} />

                            {/* Quick-select chips — evenly spaced row */}
                            <View style={styles.sepChipRow}>
                                {QUICK_SEPS.map(s => {
                                    const active = separator === s && !customSep.trim();
                                    return (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.sepChip,
                                                {
                                                    backgroundColor: active ? PURPLE : BG,
                                                    borderColor: active ? PURPLE : theme.border,
                                                },
                                            ]}
                                            onPress={() => { setSeparator(s); setCustomSep(''); }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.sepChipText, { color: active ? '#fff' : theme.subtext }]}>
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.divider, marginVertical: 12 }]} />

                            {/* Custom separator row */}
                            <View style={styles.sepCustomRow}>
                                <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>Custom:</Text>
                                <TextInput
                                    style={[
                                        styles.sepInput,
                                        {
                                            backgroundColor: BG,
                                            color: theme.text,
                                            borderColor: customSep.trim() ? PURPLE : theme.border,
                                        },
                                    ]}
                                    value={customSep}
                                    onChangeText={setCustomSep}
                                    placeholder="any char"
                                    placeholderTextColor={theme.placeholder}
                                    maxLength={3}
                                    autoCapitalize="none"
                                />
                                {customSep.trim() ? (
                                    <TouchableOpacity
                                        onPress={() => setCustomSep('')}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={{ fontSize: 15, color: theme.placeholder }}>✕</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ width: 20 }} />
                                )}
                            </View>
                        </View>

                        {/* Info card */}
                        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.infoTitle, { color: theme.text }]}>
                                About Passphrases
                            </Text>
                            <Text style={[styles.infoText, { color: theme.subtext }]}>
                                Passphrases combine random words joined by your chosen separator.
                                They're easier to remember and just as secure as random passwords.
                                Tap "New" to generate a fresh one.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 12,
    },
    modeToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 9,
    },
    modeBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    passwordCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    passwordText: {
        fontSize: 18,
        fontWeight: '700',
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
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    copyBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    newBtn: {
        flex: 1,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    lengthBtnText: {
        fontSize: 18,
        fontWeight: '700',
    },
    lengthValue: {
        fontSize: 16,
        fontWeight: '700',
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
    },
    settingSubLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    divider: {
        height: 1,
    },
    // Separator section
    sepHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    sepPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 2,
    },
    sepPreviewWord: {
        fontSize: 12,
        fontWeight: '500',
    },
    sepPreviewChar: {
        fontSize: 14,
        fontWeight: '800',
        fontFamily: 'Courier',
        marginHorizontal: 2,
    },
    sepChipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: 0,
    },
    sepChip: {
        flex: 1,
        aspectRatio: 1,
        maxHeight: 42,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    sepChipText: {
        fontSize: 15,
        fontWeight: '700',
    },
    sepCustomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 4,
    },
    sepInput: {
        flex: 1,
        borderRadius: 8,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'Courier',
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 0,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 19,
    },
});
