import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (_appearance: Appearance) => {
    document.documentElement.classList.remove('dark');
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function initializeTheme() {
    applyTheme('light');

    mediaQuery.addEventListener('change', () => {
        applyTheme('light');
    });
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        applyTheme(mode);
    };

    useEffect(() => {
        applyTheme('light');

        return () => mediaQuery.removeEventListener('change', () => {});
    }, []);

    return { appearance, updateAppearance };
}
