import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import apiClient from '../lib/apiClient';
import { useTheme } from '../lib/ThemeContext';
import type { RootStackParamList } from '../App';

// ── Types ─────────────────────────────────────────────────────────
type VaultStats = {
    total: number;
    weak: number;
    reused: number;
};

// ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { session } = useSession();
    const { theme, darkMode, setDarkMode } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [stats, setStats] = useState<VaultStats>({ total: 0, weak: 0, reused: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    const email = session?.user?.email ?? 'user@email.com';
    const initial = email.charAt(0).toUpperCase();

    const createdAt = session?.user?.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
          })
        : 'Mar 2026';

    // ── Fetch vault stats — re-runs every time this tab gains focus ───
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            setStatsLoading(true);
            const fetchStats = async () => {
                try {
                    const res = await apiClient.get('/vault');
                    if (cancelled) return;
                    const entries: any[] = res.data.entries ?? [];
                    const weakCount = entries.filter(
                        (e: any) => e.password_strength === 1
                    ).length;
                    setStats({
                        total: entries.length,
                        weak: weakCount,
                        reused: res.data.reused_count ?? 0,
                    });
                } catch {
                    // Non-critical — silently ignore
                } finally {
                    if (!cancelled) setStatsLoading(false);
                }
            };
            fetchStats();
            return () => { cancelled = true; };
        }, [])
    );

    // ── Sign out ──────────────────────────────────────────────
    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => supabase.auth.signOut(),
            },
        ]);
    };

    // ── Menu items ────────────────────────────────────────────
    const menuItems: { iconName: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }[] = [
        {
            iconName: 'key-outline',
            title: 'Change Password',
            subtitle: 'Update your account password',
            onPress: () => navigation.navigate('ChangePassword'),
        },
        {
            iconName: 'bar-chart-outline',
            title: 'Security Reports',
            subtitle: 'Recent data breaches & vault health',
            onPress: () => navigation.navigate('SecurityReports'),
        },
        {
            iconName: 'information-circle-outline',
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
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>

                {/* User card */}
                <View style={[styles.userCard, { backgroundColor: theme.card }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.purple, shadowColor: theme.purple }]}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <Text style={[styles.userEmail, { color: theme.text }]} numberOfLines={1}>
                        {email}
                    </Text>
                    <Text style={[styles.memberSince, { color: theme.placeholder }]}>
                        Member since {createdAt}
                    </Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Total', value: stats.total, color: theme.text },
                        { label: 'Weak', value: stats.weak, color: '#EF4444' },
                        { label: 'Reused', value: stats.reused, color: stats.reused > 0 ? '#F59E0B' : '#22C55E' },
                    ].map(({ label, value, color }) => (
                        <View key={label} style={[styles.statCard, { backgroundColor: theme.card }]}>
                            {statsLoading ? (
                                <ActivityIndicator color={color} size="small" />
                            ) : (
                                <Text style={[styles.statNumber, { color }]}>{value}</Text>
                            )}
                            <Text style={[styles.statLabel, { color: theme.placeholder }]}>{label}</Text>
                        </View>
                    ))}
                </View>

                {/* Dark mode toggle — wired to ThemeContext */}
                <View style={[styles.toggleCard, { backgroundColor: theme.card }]}>
                    <View style={styles.toggleLeft}>
                        <Ionicons name={darkMode ? 'moon' : 'sunny'} size={22} color={darkMode ? '#A78BFA' : '#F59E0B'} />
                        <View>
                            <Text style={[styles.toggleTitle, { color: theme.text }]}>
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </Text>
                            <Text style={[styles.toggleSubtitle, { color: theme.placeholder }]}>
                                {darkMode ? 'Easier on the eyes' : 'Bright and clean'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={darkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: theme.border, true: theme.purple }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Menu items */}
                <View style={[styles.menuCard, { backgroundColor: theme.card }]}>
                    {menuItems.map((item, idx) => (
                        <View key={item.title}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={item.iconName} size={22} color={theme.purple} style={styles.menuIcon} />
                                <View style={styles.menuTextContainer}>
                                    <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                                    <Text style={[styles.menuSubtitle, { color: theme.placeholder }]}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.border} />
                            </TouchableOpacity>
                            {idx < menuItems.length - 1 && (
                                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Sign out */}
                <TouchableOpacity
                    style={[styles.signOutBtn, { backgroundColor: theme.card }]}
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
    container: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 12,
    },
    userCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 14,
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
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
        marginBottom: 4,
    },
    memberSince: {
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    statCard: {
        flex: 1,
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
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    toggleCard: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    toggleSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    menuCard: {
        borderRadius: 12,
        marginBottom: 14,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuIcon: { marginRight: 14 },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '700' },
    menuSubtitle: { fontSize: 12, marginTop: 2 },
    divider: {
        height: 1,
        marginLeft: 52,
    },
    signOutBtn: {
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
