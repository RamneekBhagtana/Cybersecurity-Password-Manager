import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import { useSession } from './hooks/useSession';

export default function App() {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Password Manager</Text>
            <Text>
                {session ? `Logged in as: ${session.user.email}` : 'Not logged in'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
});
