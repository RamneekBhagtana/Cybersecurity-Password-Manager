import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';

export default function ProfileScreen() {
    const { session } = useSession();
    const [darkMode, setDarkMode] = useState(false);

    const email = session?.user?.email ?? 'user@email.com';
    const initial = email.charAt(0).toUpperCase();

    // Format join date from session metadata or fallback
    const createdAt = session?.user?.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
          })
        : 'Mar 2026';

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                },
            },
        ]);
    };

    const menuItems = [
        {
            title: 'Change Password',
            subtitle: 'Update your master password',
            onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.'),
        },
        {
            title: 'Security Reports',
            subtitle: 'View weak & reused passwords',
            onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.'),
        },
        {
            title: 'About',
            subtitle: 'SecureVault v1.0',
            onPress: () => {},
        },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={styles.headerTitle}>Profile</Text>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <Text style={styles.userEmail}>{email}</Text>
                    <Text style={styles.memberSince}>Member since {createdAt}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>6</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#EF4444' }]}>1</Text>
                        <Text style={styles.statLabel}>Weak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNumber, { color: '#22C55E' }]}>0</Text>
                        <Text style={styles.statLabel}>Reused</Text>
                    </View>
                </View>

                {/* Dark Mode Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleLeft}>
                        <Text style={styles.toggleIcon}>☀️</Text>
                        <View>
                            <Text style={styles.toggleTitle}>Light Mode</Text>
                            <Text style={styles.toggleSubtitle}>
                                {darkMode ? 'Tap to switch to light' : 'Tap to switch to dark'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={darkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: '#E5E7EB', true: '#6C63FF' }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Menu Items */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.title}
                            style={[
                                styles.menuItem,
                                index < menuItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuItemText}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Text style={styles.menuChevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const BG = '#F0F2F8';
const PURPLE = '#6C63FF';

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
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    avatarText: {
        color: '#fff',
        fontSize: 26,
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
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    toggleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
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
        fontWeight: '600',
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
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    menuChevron: {
        fontSize: 20,
        color: '#ccc',
    },
    signOutBtn: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    signOutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
});