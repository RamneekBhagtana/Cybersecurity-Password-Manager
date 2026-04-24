import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import apiClient from '../lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────
type VaultEntry = {
    entry_id: string;
    title: string;
    username: string | null;
    url: string | null;
    tags: string[];
    created_at: string | null;
    updated_at: string | null;
};

// ── Constants ─────────────────────────────────────────────────────
const PURPLE = '#6C63FF';
const BG = '#F0F2F8';

const TAGS = ['all', 'work', 'personal', 'school'];

// Consistent icon color palette keyed off the first character of the title
const ICON_COLORS = [
    '#1a1a2e',
    '#EA4335',
    '#E50914',
    '#FF9900',
    '#C13584',
    '#0F9D58',
    '#4285F4',
    '#6C63FF',
];

function getIconStyle(title: string): { initial: string; bg: string } {
    if (!title) return { initial: '?', bg: '#888' };
    const idx = title.toUpperCase().charCodeAt(0) % ICON_COLORS.length;
    return {
        initial: title.charAt(0).toUpperCase(),
        bg: ICON_COLORS[idx],
    };
}

// ─────────────────────────────────────────────────────────────────
export default function VaultScreen() {
    const [entries, setEntries] = useState<VaultEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTag, setActiveTag] = useState('all');

    // ── Fetch vault entries from backend ──────────────────────
    const fetchVault = useCallback(async () => {
        try {
            const res = await apiClient.get('/vault');
            setEntries(res.data.entries ?? []);
        } catch (err: any) {
            // Skip auth-abort errors silently - user isn't signed in yet
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

    useEffect(() => {
        fetchVault();
    }, [fetchVault]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchVault();
    };

    // ── Filter entries by active tag ──────────────────────────
    const filtered =
        activeTag === 'all'
            ? entries
            : entries.filter((e) => e.tags.includes(activeTag));

    // ── Loading state ─────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    <Text style={styles.loadingText}>Loading your vault...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Main render ───────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Vault</Text>
                    <Text style={styles.entryCount}>{filtered.length} items</Text>
                </View>
            </View>

            {/* Tag Filter */}
            <FlatList
                data={TAGS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(t) => t}
                contentContainerStyle={styles.tagList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.tag, activeTag === item && styles.tagActive]}
                        onPress={() => setActiveTag(item)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tagText,
                                activeTag === item && styles.tagTextActive,
                            ]}
                        >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Entries List */}
            <FlatList
                data={filtered}
                keyExtractor={(e) => e.entry_id}
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
                        <Text style={styles.emptyTitle}>No entries yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the + button to add your first password.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const { initial, bg } = getIconStyle(item.title);
                    return (
                        <TouchableOpacity style={styles.entryCard} activeOpacity={0.85}>
                            <View style={[styles.entryIcon, { backgroundColor: bg }]}>
                                <Text style={styles.entryInitial}>{initial}</Text>
                            </View>
                            <View style={styles.entryInfo}>
                                <Text style={styles.entryTitle} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {item.username && (
                                    <Text style={styles.entryUsername} numberOfLines={1}>
                                        {item.username}
                                    </Text>
                                )}
                                {item.tags.length > 0 && (
                                    <Text style={styles.entryTag}>{item.tags[0]}</Text>
                                )}
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* FAB - Add New Entry */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() =>
                    Alert.alert('Coming Soon', 'Add/Edit form will be available in Task 29.')
                }
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BG,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#888',
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    entryCount: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    tagList: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 8,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    tagActive: {
        backgroundColor: PURPLE,
        borderColor: PURPLE,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
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
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    entryCard: {
        backgroundColor: '#fff',
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
    entryInitial: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    entryInfo: {
        flex: 1,
    },
    entryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    entryUsername: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
    },
    entryTag: {
        fontSize: 12,
        color: PURPLE,
        fontWeight: '600',
        marginTop: 2,
    },
    chevron: {
        fontSize: 24,
        color: '#ccc',
        fontWeight: '300',
        marginLeft: 6,
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '300',
        marginTop: -2,
    },
});