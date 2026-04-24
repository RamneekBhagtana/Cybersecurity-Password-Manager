import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
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

function ManageCategoriesModal({ visible, order, purple, onClose, onChange }: ManageCatsProps) {
    const { theme } = useTheme();
    const [draft, setDraft] = useState<string[]>([]);
    const [newCat, setNewCat] = useState('');

    useEffect(() => { if (visible) setDraft([...order]); }, [visible, order]);

    const move = (idx: number, dir: -1 | 1) => {
        const next = [...draft];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setDraft(next);
    };

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
                <View style={catStyles.header}>
                    <Text style={[catStyles.title, { color: theme.text }]}>Manage Categories</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontSize: 15, color: theme.placeholder }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                    {draft.map((cat, idx) => (
                        <View key={cat} style={[catStyles.row, { backgroundColor: theme.card }]}>
                            <Text style={[catStyles.catName, { color: theme.text }]}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                            <View style={catStyles.rowActions}>
                                <TouchableOpacity onPress={() => move(idx, -1)} style={catStyles.iconBtn}>
                                    <Text style={[catStyles.iconText, { color: theme.subtext }]}>↑</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => move(idx, 1)} style={catStyles.iconBtn}>
                                    <Text style={[catStyles.iconText, { color: theme.subtext }]}>↓</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => remove(idx)} style={catStyles.iconBtn}>
                                    <Text style={[catStyles.iconText, { color: '#EF4444' }]}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

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
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const catStyles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
    title: { fontSize: 20, fontWeight: '800' },
    row: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
    catName: { flex: 1, fontSize: 14, fontWeight: '600' },
    rowActions: { flexDirection: 'row', gap: 4 },
    iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 16, fontWeight: '700' },
    addLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
    addRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    addInput: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
    addBtn: { width: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
});

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
});
