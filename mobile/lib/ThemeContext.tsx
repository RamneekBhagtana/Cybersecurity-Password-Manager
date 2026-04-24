import { createContext, useContext, useState, ReactNode } from 'react';

// ── Theme shape ───────────────────────────────────────────────────
export type Theme = {
    bg: string;
    card: string;
    text: string;
    subtext: string;
    placeholder: string;
    border: string;
    divider: string;
    inputBg: string;
    purple: string;
    tabBar: string;
    tabBarBorder: string;
    tagInactive: string;
    tagInactiveBorder: string;
    isDark: boolean;
};

// ── Light palette ─────────────────────────────────────────────────
export const lightTheme: Theme = {
    bg: '#F0F2F8',
    card: '#ffffff',
    text: '#1a1a2e',
    subtext: '#555555',
    placeholder: '#888888',
    border: '#E5E7EB',
    divider: '#F0F2F8',
    inputBg: '#F0F2F8',
    purple: '#6C63FF',
    tabBar: '#ffffff',
    tabBarBorder: '#E5E7EB',
    tagInactive: '#ffffff',
    tagInactiveBorder: '#E5E7EB',
    isDark: false,
};

// ── Dark palette ──────────────────────────────────────────────────
export const darkTheme: Theme = {
    bg: '#0d0d1a',
    card: '#1a1a2e',
    text: '#e8e8ff',
    subtext: '#aaaaaa',
    placeholder: '#666666',
    border: '#2a2a3e',
    divider: '#2a2a3e',
    inputBg: '#0d0d1a',
    purple: '#8B84FF',
    tabBar: '#1a1a2e',
    tabBarBorder: '#2a2a3e',
    tagInactive: '#1a1a2e',
    tagInactiveBorder: '#2a2a3e',
    isDark: true,
};

// ── Context ───────────────────────────────────────────────────────
type ThemeContextType = {
    theme: Theme;
    darkMode: boolean;
    setDarkMode: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    darkMode: false,
    setDarkMode: () => {},
});

// ── Provider ──────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [darkMode, setDarkMode] = useState(false);
    return (
        <ThemeContext.Provider
            value={{ theme: darkMode ? darkTheme : lightTheme, darkMode, setDarkMode }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────
export function useTheme() {
    return useContext(ThemeContext);
}
