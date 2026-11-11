import { useCallback, useEffect, useState } from 'react';

export interface UseNotificationsReturn {
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    polling: boolean;
}

export function useNotifications({ intervalMs = 60000 }: { intervalMs?: number } = {}): UseNotificationsReturn {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/notifications/unread-count', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                const payload = (await response.json()) as { count?: number };
                setUnreadCount(payload.count ?? 0);
            }
        } catch {
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const start = () => {
            setPolling(true);
            void refresh();
            timer = setInterval(() => void refresh(), intervalMs);
        };

        start();

        return () => {
            clearTimeout(timer);
            setPolling(false);
        };
    }, [intervalMs, refresh]);

    return { unreadCount, loading, refresh, polling };
}
