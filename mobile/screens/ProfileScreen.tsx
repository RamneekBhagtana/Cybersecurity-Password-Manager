import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import apiClient from '../lib/apiClient';

// ── Constants ─────────────────────────────────────────────────────
const PURPLE = '#6C63FF';
const BG = '#F0F2F8';

// ── Types ─────────────────────────────────────────────────────────
type VaultStats = {
    total: number;
    weak: number;
    reused: number;
};

// ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { session } = useSession();
    const [darkMode, setDarkMode] = useState(false);
    const [stats, setStats] = useState<VaultStats>({ total: 0, weak: 0, reused: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    const email = session?.user?.email ?? 'user@email.com';
    const initial = email.charAt(0).toUpperCase();

    // Format join date
    const createdAt = session?.user?.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
          })
        : 'Mar 2026';

    // ── Fetch vault stats from backend ────────────────────────
    useEffect(() => {
        let cancelled = false;

        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/vault');
                if (cancelled) return;

                const entries: any[] = res.data.entries ?? [];

                // Note: weak/reused detection requires master_password decryption
                // which happens in the Security Reports feature (Task 19).
                // For now, we show total count only and leave weak/reused at 0.
                setStats({
                    total: entries.length,
                    weak: 0,
                    reused: 0,
                });
            } catch (err) {
                // Silently fail - stats are not critical
                console.warn('Failed to load vault stats:', err);
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        };

        fetchStats();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── Sign out with SecureStore cleanup ─────────────────────
    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        // Clear stored session token
                        await SecureStore.deleteItemAsync('session_token');
                    } catch {
                        // Token may not exist - ignore
                    }
                    // Sign out from Supabase (triggers auth state listener in App.tsx)
                    await supabase.auth.signOut();
                },
            },
        ]);
    };

    // ── Menu items ────────────────────────────────────────────
    const menuItems = [
        {
            icon: '🔑',
            title: 'Change Password',
            subtitle: 'Update your master password',
            onPress: () =>
                Alert.alert('Coming Soon', 'This feature will be available soon.'),
        },
        {
            icon: '📊',
            title: 'Security Reports',
            subtitle: 'View weak & reused passwords',
            onPress: () =>
                Alert.alert('Coming Soon', 'This feature will be available soon.'),
        },
        {
            icon: 'ℹ️',
            title: 'About',
            subtitle: 'SecureVault v1.0',
            onPress: () =>
                Alert.alert(
                    'SecureVault v1.0',
                    'A secure password manager built with Flask, PostgreSQL, Supabase, and React Native.'
                ),
        },
    ];

    // ── Render ────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.headerTitle}>Profile</Text>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {email}
                    </Text>
                    <Text style={styles.memberSince}>Member since {createdAt}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        {statsLoading ? (
                            <ActivityIndicator color={PURPLE} size="small" />
                        ) : (
                            <Text style={styles.statNumber}>{stats.total}</Text>
                        )}
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        {statsLoading ? (
                            <ActivityIndicator color="#EF4444" size="small" />
                        ) : (
                            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                                {stats.weak}
                            </Text>
                        )}
                        <Text style={styles.statLabel}>Weak</Text>
                    </View>
                    <View style={styles.statCard}>
                        {statsLoading ? (
                            <ActivityIndicator color="#22C55E" size="small" />
                        ) : (
                            <Text style={[styles.statNumber, { color: '#22C55E' }]}>
                                {stats.reused}
                            </Text>
                        )}
                        <Text style={styles.statLabel}>Reused</Text>
                    </View>
                </View>

                {/* Dark Mode Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleLeft}>
                        <Text style={styles.toggleIcon}>{darkMode ? '🌙' : '☀️'}</Text>
                        <View>
                            <Text style={styles.toggleTitle}>
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </Text>
                            <Text style={styles.toggleSubtitle}>
                                {darkMode ? 'Easier on the eyes' : 'Bright and clean'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={darkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: '#D1D5DB', true: PURPLE }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, idx) => (
                        <View key={item.title}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <View style={styles.menuTextContainer}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </View>
                                <Text style={styles.menuChevron}>›</Text>
                            </TouchableOpacity>
                            {idx < menuItems.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Sign Out */}
                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={handleSignOut}
                    activeOpacity={0.85}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
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
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
    },
    userEmail: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    memberSince: {
        fontSize: 13,
        color: '#888',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a2e',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
    },
    toggleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleIcon: {
        fontSize: 22,
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    toggleSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuIcon: {
        fontSize: 22,
        marginRight: 14,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    menuChevron: {
        fontSize: 22,
        color: '#ccc',
        fontWeight: '300',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F2F8',
        marginLeft: 52,
    },
    signOutBtn: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EF4444',
    },
    signOutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
    },
});