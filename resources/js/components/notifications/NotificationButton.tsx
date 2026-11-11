import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { csrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationListItem {
    id: string;
    title: string;
    body: string;
    category: string | null;
    url: string | null;
    supplier_name: string | null;
    read: boolean;
    created_at: string;
}

interface NotificationButtonProps {
    className?: string;
}

export function NotificationButton({ className }: NotificationButtonProps = {}) {
    const page = usePage<SharedData>();
    const user = page.props.auth?.user as { id?: number; name?: string; email?: string; role?: string } | undefined;
    const { unreadCount, refresh } = useNotifications();
    const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);

    const userName = user?.name ?? 'User';

    const loadList = async (): Promise<void> => {
        try {
            const response = await fetch('/notifications/api', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                const payload = await response.json();
                const data = (payload as { data?: Array<unknown> }).data ?? [];
                setNotifications(
                    data.slice(0, 8).map((item) => {
                        const record = item as Record<string, unknown>;
                        return {
                            id: String(record.id ?? ''),
                            title: String(record.title ?? ''),
                            body: String(record.body ?? ''),
                            category: (record.category as string | null) ?? null,
                            url: (record.url as string | null) ?? null,
                            supplier_name: (record.supplier_name as string | null) ?? null,
                            read: Boolean(record.read),
                            created_at: String(record.created_at ?? ''),
                        };
                    }),
                );
            }
        } catch {
            setNotifications([]);
        } finally {
            setLoaded(true);
        }
    };

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleOpenChange = (value: boolean): void => {
        setOpen(value);
        if (value && !loaded) {
            void loadList();
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        await fetch('/notifications/read-all', {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
                ...csrfHeaders(),
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        void refresh();
        setNotifications((list) => list.map((item) => ({ ...item, read: true })));
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('group relative h-9 w-9', className)}
                    aria-label={unreadCount > 0 ? `${unreadCount} new notifications` : 'Notifications'}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="ring-offset-background absolute top-1 right-1 z-20 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-[0.6px] text-[10px] font-bold text-white shadow-sm ring-1 ring-offset-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">{userName}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[380px] p-0" align="end" sideOffset={8}>
                <div className="flex items-center justify-between border-b bg-[#00515F]/5 p-4">
                    <div>
                        <DropdownMenuLabel className="text-sm font-semibold text-gray-900">Notifications</DropdownMenuLabel>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
                        </p>
                    </div>
                    <DropdownMenuItem onClick={markAllAsRead} className="text-xs text-[#00515F] hover:bg-[#00ADC5]/10">
                        Mark all as read
                    </DropdownMenuItem>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                    {!loaded && open && <div className="flex h-32 items-center justify-center text-sm text-gray-400">Loading…</div>}
                    {loaded && notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Bell className="mb-2 h-10 w-10 text-gray-300" />
                            <p className="text-sm text-gray-500">No notifications yet.</p>
                        </div>
                    )}
                    {loaded &&
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onReadChange={() => {
                                    void refresh();
                                }}
                                compact
                            />
                        ))}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-between font-medium text-[#00515F]">
                    <Link href="/notifications" onClick={() => setOpen(false)}>
                        View all notifications
                        <span className="ml-1">→</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
