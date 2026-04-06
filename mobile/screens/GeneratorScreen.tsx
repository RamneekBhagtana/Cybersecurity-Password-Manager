import { useState, useCallback } from 'react';
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
} from 'react-native';

function generatePassword(
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

function getStrengthInfo(password: string): { label: string; color: string; width: string } {
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#F59E0B', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#84CC16', width: '75%' };
    return { label: 'Very Strong — centuries to crack', color: '#22C55E', width: '100%' };
}

export default function GeneratorScreen() {
    const [mode, setMode] = useState<'password' | 'passphrase'>('password');
    const [length, setLength] = useState(16);
    const [upper, setUpper] = useState(true);
    const [lower, setLower] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [special, setSpecial] = useState(true);
    const [password, setPassword] = useState(() =>
        generatePassword(16, { upper: true, lower: true, numbers: true, special: true })
    );

    const regenerate = useCallback(() => {
        setPassword(generatePassword(length, { upper, lower, numbers, special }));
    }, [length, upper, lower, numbers, special]);

    const handleCopy = () => {
        Clipboard.setString(password);
        Alert.alert('Copied!', 'Password copied to clipboard.');
    };

    const strength = getStrengthInfo(password);

    const adjustLength = (delta: number) => {
        const newLen = Math.min(32, Math.max(8, length + delta));
        setLength(newLen);
        setPassword(generatePassword(newLen, { upper, lower, numbers, special }));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={styles.headerTitle}>Generator</Text>

                {/* Mode Toggle */}
                <View style={styles.modeToggle}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
                        onPress={() => setMode('password')}
                    >
                        <Text style={[styles.modeBtnText, mode === 'password' && styles.modeBtnTextActive]}>
                            Password
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'passphrase' && styles.modeBtnActive]}
                        onPress={() => setMode('passphrase')}
                    >
                        <Text style={[styles.modeBtnText, mode === 'passphrase' && styles.modeBtnTextActive]}>
                            Passphrase
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Generated Password Card */}
                <View style={styles.passwordCard}>
                    <Text style={styles.passwordText}>{password}</Text>
                    <View style={styles.strengthBar}>
                        <View style={[styles.strengthFill, { flex: strength.score / 4, backgroundColor: strength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                        {strength.label}
                    </Text>
                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                            <Text style={styles.copyBtnText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.newBtn} onPress={regenerate}>
                            <Text style={styles.newBtnText}>New</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Length */}
                <View style={styles.lengthRow}>
                    <Text style={styles.settingLabel}>Length</Text>
                    <View style={styles.lengthControls}>
                        <TouchableOpacity onPress={() => adjustLength(-1)} style={styles.lengthBtn}>
                            <Text style={styles.lengthBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.lengthValue}>{length}</Text>
                        <TouchableOpacity onPress={() => adjustLength(1)} style={styles.lengthBtn}>
                            <Text style={styles.lengthBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Length Slider Visual */}
                <View style={styles.sliderTrack}>
                    <View
                        style={[
                            styles.sliderFill,
                            { width: `${((length - 8) / 24) * 100}%` },
                        ]}
                    />
                    <View style={styles.sliderThumb} />
                </View>

                {/* Toggles */}
                <View style={styles.divider} />

                {[
                    { label: 'Uppercase (A-Z)', value: upper, setter: setUpper },
                    { label: 'Lowercase (a-z)', value: lower, setter: setLower },
                    { label: 'Numbers (0-9)', value: numbers, setter: setNumbers },
                    { label: 'Special (!@#$%^&*)', value: special, setter: setSpecial },
                ].map(({ label, value, setter }) => (
                    <View key={label} style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>{label}</Text>
                        <Switch
                            value={value}
                            onValueChange={(v) => {
                                setter(v);
                                setPassword(
                                    generatePassword(length, {
                                        upper: label.startsWith('Upper') ? v : upper,
                                        lower: label.startsWith('Lower') ? v : lower,
                                        numbers: label.startsWith('Number') ? v : numbers,
                                        special: label.startsWith('Special') ? v : special,
                                    })
                                );
                            }}
                            trackColor={{ false: '#E5E7EB', true: '#6C63FF' }}
                            thumbColor="#fff"
                        />
                    </View>
                ))}
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingTop: 16,
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
        borderRadius: 10,
        alignItems: 'center',
    },
    modeBtnActive: {
        backgroundColor: PURPLE,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    modeBtnTextActive: {
        color: '#fff',
    },
    passwordCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    passwordText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },
    strengthBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 6,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    strengthFill: {
        height: 6,
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 14,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    copyBtn: {
        backgroundColor: PURPLE,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 10,
    },
    copyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    newBtn: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    newBtnText: {
        color: '#555',
        fontWeight: '700',
        fontSize: 14,
    },
    lengthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    lengthControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lengthBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lengthBtnText: {
        fontSize: 18,
        color: '#555',
        fontWeight: '600',
    },
    lengthValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
        minWidth: 28,
        textAlign: 'center',
    },
    sliderTrack: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'visible',
    },
    sliderFill: {
        height: 6,
        backgroundColor: PURPLE,
        borderRadius: 3,
    },
    sliderThumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: PURPLE,
        marginLeft: -4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    toggleLabel: {
        fontSize: 15,
        color: '#1a1a2e',
        fontWeight: '500',
    },
});