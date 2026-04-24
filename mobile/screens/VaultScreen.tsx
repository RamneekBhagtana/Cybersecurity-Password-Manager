import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    PanResponder,
    LayoutAnimation,
    UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../lib/apiClient';
import { useTheme } from '../lib/ThemeContext';

const CAT_ORDER_KEY = '@pm:categoryOrder';

// ── Types ─────────────────────────────────────────────────────────
type VaultEntry = {
    entry_id: string;
    title: string;
    username: string | null;
    url: string | null;
    tags: string[];
    password_strength: number | null;
    created_at: string | null;
    updated_at: string | null;
};

// ── Password strength ─────────────────────────────────────────────
function getStrengthInfo(score: number | null): { label: string; color: string } {
    switch (score) {
        case 1: return { label: 'Weak', color: '#EF4444' };
        case 2: return { label: 'Fair', color: '#F59E0B' };
        case 3: return { label: 'Good', color: '#84CC16' };
        case 4: return { label: 'Strong', color: '#22C55E' };
        default: return { label: 'Not rated', color: '#9CA3AF' };
    }
}

const WEAK_RECOMMENDATION =
    'For a strong password use at least 16 characters including ' +
    'an uppercase letter, a number, and a special character (e.g. !@#$).';

function showWeakAlert(onUpdate: () => void) {
    Alert.alert(
        'Weak Password',
        WEAK_RECOMMENDATION,
        [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'Update Password', onPress: onUpdate },
        ]
    );
}

// ── Constants ─────────────────────────────────────────────────────
const PRESET_CATEGORIES = ['work', 'personal', 'school'];

const ICON_COLORS = [
    '#1a1a2e', '#EA4335', '#E50914', '#FF9900',
    '#C13584', '#0F9D58', '#4285F4', '#6C63FF',
];

function getIconStyle(title: string): { initial: string; bg: string } {
    if (!title) return { initial: '?', bg: '#888' };
    const idx = title.toUpperCase().charCodeAt(0) % ICON_COLORS.length;
    return { initial: title.charAt(0).toUpperCase(), bg: ICON_COLORS[idx] };
}

// ── Add / Edit Entry Modal ────────────────────────────────────────
type EntryFormProps = {
    visible: boolean;
    editing: VaultEntry | null;
    purple: string;
    onClose: () => void;
    onSaved: () => void;
};

function EntryFormModal({ visible, editing, purple, onClose, onSaved }: EntryFormProps) {
    const { theme } = useTheme();

    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [notes, setNotes] = useState('');
    // Category: either a preset or a custom string
    const [selectedPreset, setSelectedPreset] = useState('');
    const [customCat, setCustomCat] = useState('');
    const [saving, setSaving] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [showMaster, setShowMaster] = useState(false);

    // Derived: actual tag value to submit
    const effectiveCategory = customCat.trim() || selectedPreset;

    // Populate fields when modal opens
    useEffect(() => {
        if (visible) {
            setTitle(editing?.title ?? '');
            setUsername(editing?.username ?? '');
            setPassword('');
            setMasterPassword('');
            setNotes('');
            const existingTag = editing?.tags[0] ?? '';
            if (PRESET_CATEGORIES.includes(existingTag)) {
                setSelectedPreset(existingTag);
                setCustomCat('');
            } else {
                setSelectedPreset('');
                setCustomCat(existingTag);
            }
            setShowPwd(false);
            setShowMaster(false);
        }
    }, [visible, editing]);

    // Master password is only needed when creating (always) or editing with a new password.
    const needsMasterPwd = !editing || !!password.trim();

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a title.');
            return;
        }
        if (!editing && !password.trim()) {
            Alert.alert('Required', 'Please enter a password for this entry.');
            return;
        }
        if (needsMasterPwd && !masterPassword.trim()) {
            Alert.alert('Required', 'Your master password is needed to encrypt this entry.');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, any> = {
                title: title.trim(),
                tags: effectiveCategory ? [effectiveCategory.toLowerCase()] : [],
            };
            if (needsMasterPwd) payload.master_password = masterPassword.trim();
            if (username.trim()) payload.username = username.trim();
            if (notes.trim()) payload.notes = notes.trim();
            if (password.trim()) payload.password = password.trim();

            if (editing) {
                await apiClient.put(`/vault/${editing.entry_id}`, payload);
            } else {
                await apiClient.post('/vault', payload);
            }

            onSaved();
            onClose();
        } catch (err: any) {
            const msg =
                err.response?.data?.error?.message ??
                err.message ??
                'Failed to save entry.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const inputBase = [
        formStyles.input,
        { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Modal header */}
                        <View style={formStyles.modalHeader}>
                            <Text style={[formStyles.modalTitle, { color: theme.text }]}>
                                {editing ? 'Edit Entry' : 'New Entry'}
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={{ fontSize: 16, color: theme.placeholder }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <Text style={[formStyles.label, { color: theme.subtext }]}>TITLE *</Text>
                        <TextInput
                            style={inputBase}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. GitHub, Netflix…"
                            placeholderTextColor={theme.placeholder}
                            autoCapitalize="words"
                        />

                        {/* Username */}
                        <Text style={[formStyles.label, { color: theme.subtext, marginTop: 14 }]}>
                            USERNAME / EMAIL
                        </Text>
                        <TextInput
                            style={inputBase}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Optional"
                            placeholderTextColor={theme.placeholder}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        {/* Password */}
                        <Text style={[formStyles.label, { color: theme.subtext, marginTop: 14 }]}>
                            {editing ? 'NEW PASSWORD (leave blank to keep current)' : 'PASSWORD *'}
                        </Text>
                        <View style={[...inputBase, formStyles.rowInput]}>
                            <TextInput
                                style={[formStyles.rowInputField, { color: theme.text }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder={editing ? 'Leave blank to keep current' : 'Enter password'}
                                placeholderTextColor={theme.placeholder}
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPwd(v => !v)}
                                style={formStyles.eyeBtn}
                            >
                                <Text style={{ fontSize: 16 }}>{showPwd ? '🙈' : '👁'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Category */}
                        <Text style={[formStyles.label, { color: theme.subtext, marginTop: 14 }]}>
                            CATEGORY
                        </Text>

                        {/* Preset chips */}
                        <View style={formStyles.categoryRow}>
                            {PRESET_CATEGORIES.map(cat => {
                                const active = selectedPreset === cat && !customCat.trim();
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            formStyles.categoryBtn,
                                            {
                                                backgroundColor: active ? purple : theme.inputBg,
                                                borderColor: active ? purple : theme.border,
                                            },
                                        ]}
                                        onPress={() => {
                                            setSelectedPreset(active ? '' : cat);
                                            setCustomCat('');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: '600',
                                                color: active ? '#fff' : theme.subtext,
                                            }}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Custom category input */}
                        <View style={[formStyles.customCatRow, { borderColor: theme.border }]}>
                            <Text style={[formStyles.customCatLabel, { color: theme.placeholder }]}>
                                or custom:
                            </Text>
                            <TextInput
                                style={[
                                    formStyles.customCatInput,
                                    {
                                        color: theme.text,
                                        borderColor: customCat.trim() ? purple : 'transparent',
                                        backgroundColor: theme.inputBg,
                                    },
                                ]}
                                value={customCat}
                                onChangeText={v => {
                                    setCustomCat(v);
                                    if (v.trim()) setSelectedPreset('');
                                }}
                                placeholder="e.g. finance, travel…"
                                placeholderTextColor={theme.placeholder}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Notes */}
                        <Text style={[formStyles.label, { color: theme.subtext, marginTop: 14 }]}>NOTES</Text>
                        <TextInput
                            style={[...inputBase, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Any additional notes…"
                            placeholderTextColor={theme.placeholder}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Master password — only required when encrypting (create or password change) */}
                        {needsMasterPwd && (
                            <View
                                style={[
                                    formStyles.masterBox,
                                    {
                                        backgroundColor: theme.isDark ? '#1a1520' : '#FFF8F0',
                                        borderColor: theme.isDark ? '#3a2a3e' : '#FDDCB0',
                                    },
                                ]}
                            >
                                <Text style={[formStyles.label, { color: '#F59E0B' }]}>
                                    MASTER PASSWORD *
                                </Text>
                                <View style={[...inputBase, formStyles.rowInput]}>
                                    <TextInput
                                        style={[formStyles.rowInputField, { color: theme.text }]}
                                        value={masterPassword}
                                        onChangeText={setMasterPassword}
                                        placeholder="Required to encrypt this entry"
                                        placeholderTextColor={theme.placeholder}
                                        secureTextEntry={!showMaster}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowMaster(v => !v)}
                                        style={formStyles.eyeBtn}
                                    >
                                        <Text style={{ fontSize: 16 }}>{showMaster ? '🙈' : '👁'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={formStyles.masterHint}>
                                    This is your account password — used to encrypt the entry.
                                </Text>
                            </View>
                        )}

                        {/* Save button */}
                        <TouchableOpacity
                            style={[formStyles.saveBtn, { backgroundColor: purple }]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text style={formStyles.saveBtnText}>
                                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Entry'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

// ── Form styles ───────────────────────────────────────────────────
const formStyles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 22, fontWeight: '800' },
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
    rowInputField: { flex: 1, paddingVertical: 12, fontSize: 14 },
    eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
    categoryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    categoryBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    customCatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 0,
    },
    customCatLabel: {
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 0,
    },
    customCatInput: {
        flex: 1,
        borderRadius: 8,
        borderWidth: 1.5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        fontSize: 13,
    },
    masterBox: {
        borderRadius: 10,
        padding: 12,
        marginTop: 14,
        borderWidth: 1,
    },
    masterHint: {
        fontSize: 11,
        color: '#F59E0B',
        marginTop: 6,
    },
    saveBtn: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ── Category-manage modal ─────────────────────────────────────────
type ManageCatsProps = {
    visible: boolean;
    order: string[];
    purple: string;
    onClose: () => void;
    onChange: (next: string[]) => void;
};

// Each row is exactly this tall (paddingVertical 12 × 2 + content 20 + marginBottom 8 = 52 → rounded to 60)
const ITEM_H = 60;

function ManageCategoriesModal({ visible, order, purple, onClose, onChange }: ManageCatsProps) {
    const { theme } = useTheme();
    const [draft, setDraft] = useState<string[]>([]);
    const [newCat, setNewCat] = useState('');
    // draggingIdx: which row is being held; dragTargetIdx: where it will land
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null);
    const dragY = useRef(new Animated.Value(0)).current;
    const draggingIdxRef = useRef<number | null>(null);
    const draftRef = useRef<string[]>([]);

    useEffect(() => {
        if (visible) {
            setDraft([...order]);
            draftRef.current = [...order];
        }
    }, [visible, order]);

    useEffect(() => { draftRef.current = draft; }, [draft]);

    const createPanResponder = useCallback((index: number) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                draggingIdxRef.current = index;
                setDraggingIdx(index);
                setDragTargetIdx(index);
                dragY.setValue(0);
            },
            onPanResponderMove: (_evt, gs) => {
                dragY.setValue(gs.dy);
                // Compute which slot the dragged item is hovering over
                const target = Math.max(
                    0,
                    Math.min(draftRef.current.length - 1, Math.round(index + gs.dy / ITEM_H)),
                );
                setDragTargetIdx(target);
            },
            onPanResponderRelease: (_evt, gs) => {
                const from = draggingIdxRef.current!;
                const moved = Math.round(gs.dy / ITEM_H);
                const to = Math.max(0, Math.min(draftRef.current.length - 1, from + moved));

                // Animate the reorder
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                if (from !== to) {
                    const next = [...draftRef.current];
                    const [item] = next.splice(from, 1);
                    next.splice(to, 0, item);
                    setDraft(next);
                }
                dragY.setValue(0);
                setDraggingIdx(null);
                setDragTargetIdx(null);
                draggingIdxRef.current = null;
            },
            onPanResponderTerminate: () => {
                dragY.setValue(0);
                setDraggingIdx(null);
                setDragTargetIdx(null);
                draggingIdxRef.current = null;
            },
        });
    }, [dragY]);

    // Memoised by length — panResponder at position i always identifies as index i (correct after reorders)
    const panResponders = useMemo(
        () => draft.map((_, i) => createPanResponder(i)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [draft.length, createPanResponder],
    );

    const remove = (idx: number) => {
        setDraft(d => d.filter((_, i) => i !== idx));
    };

    const add = () => {
        const cat = newCat.trim().toLowerCase();
        if (!cat || draft.includes(cat)) { setNewCat(''); return; }
        setDraft(d => [...d, cat]);
        setNewCat('');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={catStyles.header}>
                        <Text style={[catStyles.title, { color: theme.text }]}>Manage Categories</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 15, color: theme.placeholder }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/*
                     * Draggable list is NOT inside a ScrollView.
                     * Nesting PanResponder inside ScrollView causes gesture conflicts —
                     * moving it to a plain View gives PanResponder uncontested control.
                     */}
                    <View style={catStyles.listSection}>
                        <Text style={[catStyles.hint, { color: theme.placeholder }]}>
                            Hold ≡ and drag to reorder
                        </Text>

                        {draft.map((cat, idx) => {
                            const isDragging = draggingIdx === idx;
                            // Highlight the slot where the dragged item will land
                            const isDropTarget =
                                dragTargetIdx === idx &&
                                draggingIdx !== null &&
                                draggingIdx !== idx;

                            return (
                                <Animated.View
                                    key={cat}
                                    style={[
                                        catStyles.row,
                                        {
                                            backgroundColor: theme.card,
                                            borderWidth: 1.5,
                                            borderColor: isDropTarget ? purple : 'transparent',
                                            opacity: isDragging ? 0.72 : 1,
                                        },
                                        isDragging && {
                                            transform: [{ translateY: dragY }],
                                            zIndex: 999,
                                            elevation: 10,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.18,
                                            shadowRadius: 8,
                                        },
                                    ]}
                                >
                                    {/* Drag handle — only this area initiates the drag */}
                                    <View
                                        style={catStyles.dragHandle}
                                        {...panResponders[idx]?.panHandlers}
                                    >
                                        <Text style={[catStyles.dragIcon, { color: theme.placeholder }]}>≡</Text>
                                    </View>

                                    <Text style={[catStyles.catName, { color: theme.text }]}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => remove(idx)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '700' }}>✕</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Add + Save — separate from the draggable region */}
                    <View style={catStyles.addSection}>
                        <Text style={[catStyles.addLabel, { color: theme.subtext }]}>ADD CATEGORY</Text>
                        <View style={catStyles.addRow}>
                            <TextInput
                                style={[catStyles.addInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: newCat.trim() ? purple : theme.border }]}
                                value={newCat}
                                onChangeText={setNewCat}
                                placeholder="e.g. finance, travel…"
                                placeholderTextColor={theme.placeholder}
                                autoCapitalize="none"
                                onSubmitEditing={add}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                style={[catStyles.addBtn, { backgroundColor: purple }]}
                                onPress={add}
                                activeOpacity={0.85}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[catStyles.saveBtn, { backgroundColor: purple }]}
                            onPress={() => { onChange(draft); onClose(); }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const catStyles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
    title: { fontSize: 20, fontWeight: '800' },
    hint: { fontSize: 12, marginBottom: 10 },
    // Plain View — no ScrollView — so PanResponder has no gesture competition
    listSection: { paddingHorizontal: 20, paddingBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
    catName: { flex: 1, fontSize: 14, fontWeight: '600' },
    dragHandle: { paddingRight: 14, paddingVertical: 6 },
    dragIcon: { fontSize: 22 },
    addSection: { paddingHorizontal: 20, paddingTop: 8 },
    addLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
    addRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    addInput: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
    addBtn: { width: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
});

// ── Rate-all modal ────────────────────────────────────────────────
type RateAllProps = {
    visible: boolean;
    purple: string;
    onClose: () => void;
    onDone: () => void;
};

function RateAllModal({ visible, purple, onClose, onDone }: RateAllProps) {
    const { theme } = useTheme();
    const [masterPassword, setMasterPassword] = useState('');
    const [showMaster, setShowMaster] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) { setMasterPassword(''); setShowMaster(false); }
    }, [visible]);

    const handleRate = async () => {
        if (!masterPassword.trim()) {
            Alert.alert('Required', 'Enter your master password to analyze passwords.');
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.post('/vault/recompute-strengths', {
                master_password: masterPassword.trim(),
            });
            const { updated, failed } = res.data;
            Alert.alert(
                'Done',
                `${updated} password${updated !== 1 ? 's' : ''} analyzed${failed ? `, ${failed} could not be decrypted` : ''}.`,
            );
            onDone();
            onClose();
        } catch (err: any) {
            const msg =
                err.response?.data?.error?.message ??
                err.message ??
                'Failed to analyze passwords.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>Rate Passwords</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 15, color: theme.placeholder }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.subtext, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
                        Enter your master password to decrypt and rate the strength of all existing vault entries.
                    </Text>
                    <Text style={[formStyles.label, { color: theme.subtext }]}>MASTER PASSWORD</Text>
                    <View style={[formStyles.input, formStyles.rowInput, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <TextInput
                            style={[formStyles.rowInputField, { color: theme.text }]}
                            value={masterPassword}
                            onChangeText={setMasterPassword}
                            placeholder="Your master password"
                            placeholderTextColor={theme.placeholder}
                            secureTextEntry={!showMaster}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowMaster(v => !v)} style={formStyles.eyeBtn}>
                            <Text style={{ fontSize: 16 }}>{showMaster ? '🙈' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[formStyles.saveBtn, { backgroundColor: purple, marginTop: 24, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleRate}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={formStyles.saveBtnText}>
                            {loading ? 'Analyzing…' : 'Analyze & Rate Passwords'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

// ── Main screen ───────────────────────────────────────────────────
export default function VaultScreen() {
    const { theme } = useTheme();
    const PURPLE = theme.purple;

    const [entries, setEntries] = useState<VaultEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTag, setActiveTag] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
    const [manageCatsVisible, setManageCatsVisible] = useState(false);
    const [rateAllVisible, setRateAllVisible] = useState(false);
    const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

    // ── Load / persist category order ─────────────────────────
    useEffect(() => {
        AsyncStorage.getItem(CAT_ORDER_KEY).then(val => {
            if (val) setCategoryOrder(JSON.parse(val));
        });
    }, []);

    const saveCategoryOrder = useCallback((next: string[]) => {
        setCategoryOrder(next);
        AsyncStorage.setItem(CAT_ORDER_KEY, JSON.stringify(next));
        // Reset active tag if it was removed
        setActiveTag(prev => (prev === 'all' || next.includes(prev) ? prev : 'all'));
    }, []);

    // ── Compute filter tags — respects stored order ───────────
    const filterTags = useMemo(() => {
        const vaultTags = new Set<string>();
        entries.forEach(e => e.tags.forEach(t => vaultTags.add(t)));
        PRESET_CATEGORIES.forEach(p => vaultTags.add(p));

        // Ordered by user preference; any unseen tags appended at the end
        const seen = new Set<string>();
        const ordered: string[] = [];
        categoryOrder.forEach(c => {
            if (vaultTags.has(c) && !seen.has(c)) { seen.add(c); ordered.push(c); }
        });
        vaultTags.forEach(t => {
            if (!seen.has(t)) { seen.add(t); ordered.push(t); }
        });

        return ['all', ...ordered];
    }, [entries, categoryOrder]);

    // ── Fetch vault entries ───────────────────────────────────
    const fetchVault = useCallback(async () => {
        try {
            const res = await apiClient.get('/vault');
            setEntries(res.data.entries ?? []);
        } catch (err: any) {
            if (err.message?.includes('No active session')) {
                setLoading(false);
                return;
            }
            const msg =
                err.response?.data?.error?.message ??
                err.message ??
                'Failed to load vault entries.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchVault(); }, [fetchVault]);

    const onRefresh = () => { setRefreshing(true); fetchVault(); };

    const filtered =
        activeTag === 'all'
            ? entries
            : entries.filter(e => e.tags.includes(activeTag));

    const hasUnrated = entries.some(e => e.password_strength === null);

    // ── Loading state ─────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    <Text style={{ marginTop: 12, color: theme.placeholder, fontSize: 14 }}>
                        Loading your vault…
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Main render ───────────────────────────────────────────
    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
            {/*
             * Compact top section — title + item count on one line,
             * category chips directly below with zero wasted space.
             */}
            <View style={styles.topSection}>
                {/* Title row */}
                <View style={styles.titleRow}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>My Vault</Text>
                    <Text style={[styles.entryCount, { color: theme.placeholder }]}>
                        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {/* Category chips — horizontal scroll + manage button */}
                <View style={styles.tagRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagList}
                        style={{ flex: 1 }}
                    >
                        {filterTags.map(tag => (
                            <TouchableOpacity
                                key={tag}
                                style={[
                                    styles.tag,
                                    {
                                        backgroundColor: theme.tagInactive,
                                        borderColor: theme.tagInactiveBorder,
                                    },
                                    activeTag === tag && {
                                        backgroundColor: PURPLE,
                                        borderColor: PURPLE,
                                    },
                                ]}
                                onPress={() => setActiveTag(tag)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.tagText,
                                        { color: theme.subtext },
                                        activeTag === tag && { color: '#fff' },
                                    ]}
                                >
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[styles.manageBtn, { backgroundColor: theme.tagInactive, borderColor: theme.tagInactiveBorder }]}
                        onPress={() => setManageCatsVisible(true)}
                        activeOpacity={0.8}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                        <Text style={[styles.manageBtnText, { color: theme.subtext }]}>⚙</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Entries list */}
            <FlatList
                data={filtered}
                keyExtractor={e => e.entry_id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    hasUnrated ? (
                        <TouchableOpacity
                            style={[
                                styles.unratedBanner,
                                {
                                    backgroundColor: theme.isDark ? '#1a1520' : '#FFF8F0',
                                    borderColor: theme.isDark ? '#3a2a3e' : '#FDDCB0',
                                },
                            ]}
                            onPress={() => setRateAllVisible(true)}
                            activeOpacity={0.85}
                        >
                            <Text style={{ fontSize: 16, marginRight: 10 }}>⚠️</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.isDark ? '#F59E0B' : '#92400E', fontWeight: '700', fontSize: 13 }}>
                                    Some passwords haven't been rated
                                </Text>
                                <Text style={{ color: theme.isDark ? '#F59E0B' : '#B45309', fontSize: 12, marginTop: 2 }}>
                                    Tap to analyze all password strengths
                                </Text>
                            </View>
                            <Text style={{ color: theme.isDark ? '#F59E0B' : '#92400E', fontSize: 20 }}>›</Text>
                        </TouchableOpacity>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={PURPLE}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔐</Text>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No entries yet</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                            Tap the + button to add your first password.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const { initial, bg } = getIconStyle(item.title);
                    const strength = getStrengthInfo(item.password_strength);
                    const isWeak = item.password_strength === 1;
                    const openEntry = () => {
                        setEditingEntry(item);
                        setModalVisible(true);
                    };
                    return (
                        <TouchableOpacity
                            style={[styles.entryCard, { backgroundColor: theme.card }]}
                            activeOpacity={0.85}
                            onPress={() => {
                                if (isWeak) {
                                    showWeakAlert(openEntry);
                                } else {
                                    openEntry();
                                }
                            }}
                        >
                            <View style={[styles.entryIcon, { backgroundColor: bg }]}>
                                <Text style={styles.entryInitial}>{initial}</Text>
                            </View>
                            <View style={styles.entryInfo}>
                                <Text style={[styles.entryTitle, { color: theme.text }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {item.username && (
                                    <Text style={[styles.entryUsername, { color: theme.subtext }]} numberOfLines={1}>
                                        {item.username}
                                    </Text>
                                )}
                                <Text style={[styles.entryTag, { color: strength.color }]}>
                                    {strength.label}
                                </Text>
                            </View>
                            <Text style={[styles.chevron, { color: theme.border }]}>›</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* FAB — add new entry */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: PURPLE, shadowColor: PURPLE }]}
                activeOpacity={0.85}
                onPress={() => {
                    setEditingEntry(null);
                    setModalVisible(true);
                }}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add / Edit modal */}
            <EntryFormModal
                visible={modalVisible}
                editing={editingEntry}
                purple={PURPLE}
                onClose={() => setModalVisible(false)}
                onSaved={fetchVault}
            />

            {/* Manage categories modal */}
            <ManageCategoriesModal
                visible={manageCatsVisible}
                order={filterTags.filter(t => t !== 'all')}
                purple={PURPLE}
                onClose={() => setManageCatsVisible(false)}
                onChange={saveCategoryOrder}
            />

            {/* Rate all passwords modal */}
            <RateAllModal
                visible={rateAllVisible}
                purple={PURPLE}
                onClose={() => setRateAllVisible(false)}
                onDone={fetchVault}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Top section — title + chips as one unified block
    topSection: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
    },
    entryCount: {
        fontSize: 13,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagList: {
        gap: 6,
        paddingBottom: 10,
    },
    manageBtn: {
        marginLeft: 6,
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    manageBtnText: {
        fontSize: 14,
    },
    tag: {
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1.5,
        marginRight: 6,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    entryCard: {
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    entryIcon: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    entryInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
    entryInfo: { flex: 1 },
    entryTitle: { fontSize: 15, fontWeight: '700' },
    entryUsername: { fontSize: 13, marginTop: 2 },
    entryTag: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    chevron: { fontSize: 24, fontWeight: '300', marginLeft: 6 },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
    unratedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        marginBottom: 12,
    },
});
