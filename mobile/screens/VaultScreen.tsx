import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    FlatList,
} from 'react-native';

type VaultEntry = {
    id: string;
    title: string;
    username: string;
    tag: string;
    tagColor: string;
    initial: string;
    iconBg: string;
    strength: 'strong' | 'medium' | 'weak';
};

const MOCK_ENTRIES: VaultEntry[] = [
    {
        id: '1',
        title: 'GitHub',
        username: 'marcelo.tsx',
        tag: 'work',
        tagColor: '#6C63FF',
        initial: 'G',
        iconBg: '#1a1a2e',
        strength: 'strong',
    },
    {
        id: '2',
        title: 'Gmail',
        username: 'jenna.k@gmail.com',
        tag: 'personal',
        tagColor: '#6C63FF',
        initial: 'G',
        iconBg: '#EA4335',
        strength: 'strong',
    },
    {
        id: '3',
        title: 'Netflix',
        username: 'liwei_watches',
        tag: 'entertainment',
        tagColor: '#6C63FF',
        initial: 'N',
        iconBg: '#E50914',
        strength: 'medium',
    },
    {
        id: '4',
        title: 'AWS Console',
        username: 'ops@revsolve.io',
        tag: 'work',
        tagColor: '#6C63FF',
        initial: 'A',
        iconBg: '#FF9900',
        strength: 'strong',
    },
    {
        id: '5',
        title: 'Instagram',
        username: 'sierra.creative',
        tag: 'personal',
        tagColor: '#6C63FF',
        initial: 'I',
        iconBg: '#C13584',
        strength: 'weak',
    },
];

const TAGS = ['all', 'work', 'personal', 'school'];

const strengthDot: Record<string, string> = {
    strong: '#22C55E',
    medium: '#F59E0B',
    weak: '#EF4444',
};

export default function VaultScreen() {
    const [activeTag, setActiveTag] = useState('all');

    const filtered =
        activeTag === 'all'
            ? MOCK_ENTRIES
            : MOCK_ENTRIES.filter((e) => e.tag === activeTag);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Vault</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={styles.iconText}>☾</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={styles.iconText}>🔍</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tag Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagScroll}
                contentContainerStyle={styles.tagContainer}
            >
                {TAGS.map((tag) => (
                    <TouchableOpacity
                        key={tag}
                        style={[styles.tagPill, activeTag === tag && styles.tagPillActive]}
                        onPress={() => setActiveTag(tag)}
                    >
                        <Text
                            style={[styles.tagText, activeTag === tag && styles.tagTextActive]}
                        >
                            {tag}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Entry Count */}
            <Text style={styles.entryCount}>
                Showing {filtered.length} of {MOCK_ENTRIES.length} entries
            </Text>

            {/* Vault List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.entryCard}>
                        <View style={[styles.entryIcon, { backgroundColor: item.iconBg }]}>
                            <Text style={styles.entryInitial}>{item.initial}</Text>
                        </View>
                        <View style={styles.entryInfo}>
                            <View style={styles.entryTitleRow}>
                                <Text style={styles.entryTitle}>{item.title}</Text>
                                <View
                                    style={[
                                        styles.strengthDot,
                                        { backgroundColor: strengthDot[item.strength] },
                                    ]}
                                />
                            </View>
                            <Text style={styles.entryUsername}>{item.username}</Text>
                            <Text style={styles.entryTag}>{item.tag}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                )}
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
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
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        padding: 6,
    },
    iconText: {
        fontSize: 18,
        color: '#555',
    },
    tagScroll: {
        paddingLeft: 20,
        marginBottom: 4,
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 20,
        paddingVertical: 8,
    },
    tagPill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    tagPillActive: {
        backgroundColor: PURPLE,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    tagTextActive: {
        color: '#fff',
    },
    entryCount: {
        fontSize: 13,
        color: '#888',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        gap: 8,
    },
    entryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
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
    entryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    entryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    strengthDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
        fontSize: 20,
        color: '#ccc',
        fontWeight: '300',
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        width: 52,
        height: 52,
        borderRadius: 16,
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