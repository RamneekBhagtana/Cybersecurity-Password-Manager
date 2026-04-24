import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import { useTheme } from '../lib/ThemeContext';

// ── Static breach data ────────────────────────────────────────────
// Listed in reverse-chronological order; update as new breaches occur.
const RECENT_BREACHES = [
    {
        id: '1',
        service: 'National Public Data',
        date: 'Aug 2024',
        records: '2.9 billion',
        severity: 'critical' as const,
        details:
            'Social Security numbers, names, addresses, and phone numbers leaked from a background-check data broker.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/national-public-data-confirms-breach-exposing-social-security-numbers/',
    },
    {
        id: '2',
        service: 'Ticketmaster / Live Nation',
        date: 'May 2024',
        records: '560 million',
        severity: 'high' as const,
        details:
            'Customer names, addresses, phone numbers, partial payment card data exposed by the ShinyHunters group.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/ticketmaster-confirms-massive-breach-after-stolen-data-for-sale-online/',
    },
    {
        id: '3',
        service: 'AT&T',
        date: 'Jul 2024',
        records: '110 million',
        severity: 'high' as const,
        details:
            'Call and text metadata for nearly all AT&T wireless customers exposed from a third-party cloud platform.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/massive-atandt-data-breach-exposes-call-logs-of-109-million-customers/',
    },
    {
        id: '4',
        service: 'Dell',
        date: 'May 2024',
        records: '49 million',
        severity: 'medium' as const,
        details:
            'Customer order data including names, physical addresses, and Dell hardware details posted to a hacking forum.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/dell-api-abused-to-steal-49-million-customer-records-in-data-breach/',
    },
    {
        id: '5',
        service: 'Change Healthcare (UnitedHealth)',
        date: 'Feb 2024',
        records: '100 million+',
        severity: 'critical' as const,
        details:
            'Largest healthcare data breach in US history. Patient records, insurance details, and medical histories exposed.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/unitedhealth-says-data-of-100-million-stolen-in-change-healthcare-breach/',
    },
    {
        id: '6',
        service: 'Trello',
        date: 'Jan 2024',
        records: '15 million',
        severity: 'medium' as const,
        details:
            'Email addresses scraped via public API and combined with profile data, then published on a hacking forum.',
        articleUrl: 'https://www.bleepingcomputer.com/news/security/trello-api-abused-to-link-email-addresses-to-15-million-accounts/',
    },
];

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#84CC16',
};

const SEVERITY_BG: Record<string, string> = {
    critical: '#FEF2F2',
    high: '#FFFBEB',
    medium: '#F7FEE7',
};

const SEVERITY_BG_DARK: Record<string, string> = {
    critical: '#2a0a0a',
    high: '#2a1a00',
    medium: '#0f2010',
};

// ─────────────────────────────────────────────────────────────────
export default function SecurityReportsScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();

    const [total, setTotal] = useState<number | null>(null);
    const [weakCount, setWeakCount] = useState<number | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch vault stats for the health summary
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await apiClient.get('/vault');
                const entries: any[] = res.data.entries ?? [];
                if (!cancelled) {
                    setTotal(entries.length);
                    setWeakCount(entries.filter((e: any) => e.password_strength === 1).length);
                }
            } catch {
                // non-critical
            } finally {
                if (!cancelled) setStatsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: 48 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={[styles.backBtn, { color: theme.purple }]}>‹ Back</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.pageTitle, { color: theme.text }]}>Security Reports</Text>
                <Text style={[styles.pageSubtitle, { color: theme.placeholder }]}>
                    Your vault health and recent public data breaches
                </Text>

                {/* Vault health summary */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Vault Health</Text>
                    {statsLoading ? (
                        <ActivityIndicator color={theme.purple} style={{ marginVertical: 12 }} />
                    ) : (
                        <View style={styles.healthRow}>
                            <View style={styles.healthItem}>
                                <Text style={[styles.healthNum, { color: theme.purple }]}>
                                    {total ?? '—'}
                                </Text>
                                <Text style={[styles.healthLabel, { color: theme.placeholder }]}>
                                    Total entries
                                </Text>
                            </View>
                            <View style={[styles.healthDivider, { backgroundColor: theme.divider }]} />
                            <View style={styles.healthItem}>
                                <Text style={[styles.healthNum, { color: '#EF4444' }]}>
                                    {weakCount ?? '—'}
                                </Text>
                                <Text style={[styles.healthLabel, { color: theme.placeholder }]}>
                                    Weak
                                </Text>
                            </View>
                            <View style={[styles.healthDivider, { backgroundColor: theme.divider }]} />
                            <View style={styles.healthItem}>
                                <Text style={[styles.healthNum, { color: '#22C55E' }]}>✓</Text>
                                <Text style={[styles.healthLabel, { color: theme.placeholder }]}>
                                    Encrypted
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Breach tip */}
                <View
                    style={[
                        styles.tipCard,
                        {
                            backgroundColor: theme.isDark ? '#1a1520' : '#FFF8F0',
                            borderColor: theme.isDark ? '#3a2a3e' : '#FDDCB0',
                        },
                    ]}
                >
                    <Text style={styles.tipEmoji}>💡</Text>
                    <Text style={[styles.tipText, { color: theme.isDark ? '#F59E0B' : '#92400E' }]}>
                        If a service you use appears below, change your password for that site immediately — especially if you reuse it elsewhere.
                    </Text>
                </View>

                {/* Recent breach list */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>
                    Recent Data Breaches
                </Text>

                {RECENT_BREACHES.map(breach => {
                    const color = SEVERITY_COLORS[breach.severity];
                    const bgColor = theme.isDark
                        ? SEVERITY_BG_DARK[breach.severity]
                        : SEVERITY_BG[breach.severity];

                    return (
                        <TouchableOpacity
                            key={breach.id}
                            style={[styles.breachCard, { backgroundColor: theme.card }]}
                            activeOpacity={0.8}
                            onPress={() => Linking.openURL(breach.articleUrl)}
                        >
                            {/* Top row */}
                            <View style={styles.breachTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.breachService, { color: theme.text }]}>
                                        {breach.service}
                                    </Text>
                                    <Text style={[styles.breachMeta, { color: theme.placeholder }]}>
                                        {breach.date} · {breach.records} records
                                    </Text>
                                </View>
                                <View style={[styles.severityBadge, { backgroundColor: bgColor }]}>
                                    <Text style={[styles.severityText, { color }]}>
                                        {breach.severity.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Details */}
                            <Text style={[styles.breachDetails, { color: theme.subtext }]}>
                                {breach.details}
                            </Text>
                            <Text style={[styles.readMore, { color: theme.purple }]}>
                                Read more →
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {/* HIBP recommendation */}
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.card, marginTop: 4 }]}
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL('https://haveibeenpwned.com')}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Check Your Email
                    </Text>
                    <Text style={[styles.hibpText, { color: theme.subtext }]}>
                        Tap to visit{' '}
                        <Text style={{ color: theme.purple, fontWeight: '700' }}>
                            haveibeenpwned.com
                        </Text>
                        {' '}and check if any of your email addresses have appeared in a known data breach.
                    </Text>
                    <Text style={[styles.readMore, { color: theme.purple, marginTop: 8 }]}>
                        Open haveibeenpwned.com →
                    </Text>
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
    header: {
        marginBottom: 8,
    },
    backBtn: {
        fontSize: 17,
        fontWeight: '600',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    card: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    healthItem: {
        flex: 1,
        alignItems: 'center',
    },
    healthNum: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    healthLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    healthDivider: {
        width: 1,
        height: 36,
        marginHorizontal: 8,
    },
    healthNote: {
        fontSize: 12,
        lineHeight: 17,
    },
    tipCard: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 20,
    },
    tipEmoji: {
        fontSize: 18,
        marginTop: 1,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    breachCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    breachTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    breachService: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    breachMeta: {
        fontSize: 12,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
        alignSelf: 'flex-start',
    },
    severityText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    breachDetails: {
        fontSize: 13,
        lineHeight: 18,
    },
    hibpText: {
        fontSize: 14,
        lineHeight: 20,
    },
    readMore: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
});
