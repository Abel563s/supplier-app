import { CategoryIcon, categoryColors, categoryLabel, formatDateTime } from '@/components/notifications/icons';
import { Button } from '@/components/ui/button';
import { csrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import { type Notification } from '@/types';
import { ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';

interface NotificationItemProps {
    notification: Notification;
    onReadChange?: (id: string) => void;
    compact?: boolean;
}

export function NotificationItem({ notification, onReadChange, compact = false }: NotificationItemProps) {
    const [marking, setMarking] = useState(false);

    const style = categoryColors[notification.category ?? ''] ?? categoryColors.system_updates;

    const markAsRead = async (): Promise<void> => {
        if (notification.read || marking) {
            return;
        }

        setMarking(true);

        try {
            await fetch(`/notifications/${notification.id}/read`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    ...csrfHeaders(),
                    Accept: 'application/json',
                },
            });

            onReadChange?.(notification.id);
        } catch {
            // Ignore mark-as-read failures; the UI remains consistent on next poll.
        } finally {
            setMarking(false);
        }
    };

    const handleClick = async (): Promise<void> => {
        await markAsRead();

        if (notification.url) {
            window.location.href = notification.url;
        }
    };

    return (
        <div
            className={cn(
                'group hover:bg-accent/50 flex items-start gap-3 rounded-xl border p-3 transition-colors',
                !notification.read ? 'border-[#00ADC5]/40 bg-[#e8f4f5]/60' : 'border-transparent',
                compact ? 'p-2' : 'p-3',
            )}
        >
            <div className={cn('flex shrink-0 items-center justify-center', style.bg)}>
                <CategoryIcon category={notification.category} className={cn('text-', style.text)} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                            style.border,
                            style.text,
                            notification.read ? 'bg-transparent' : style.bg,
                        )}
                    >
                        {categoryLabel(notification.category)}
                    </span>
                    {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-[#00ADC5]" />}
                </div>

                <h3 className={cn('mt-0.5 text-sm leading-tight font-semibold', notification.read ? 'text-gray-900' : 'font-bold text-[#00515F]')}>
                    {notification.title}
                </h3>
                <p className={cn('mt-1 text-sm leading-relaxed text-gray-600', notification.read && 'text-gray-500')}>{notification.body}</p>

                {notification.supplier_name && <p className="mt-1 text-xs font-medium text-gray-500">Supplier: {notification.supplier_name}</p>}

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(notification.created_at)}</span>
                    {notification.read && (
                        <>
                            <span className="mx-1">·</span>
                            <span>Read</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {notification.url && (
                    <button onClick={handleClick} className="rounded-md p-1.5 text-[#00515F] hover:bg-[#00ADC5]/10 hover:text-[#00515F]" title="View">
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={(event) => {
                        event.preventDefault();
                        void markAsRead();
                    }}
                    disabled={marking || notification.read}
                    className="opacity-60 hover:opacity-100"
                    aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
                >
                    {notification.read ? <span className="sr-only">Mark as unread</span> : <span className="sr-only">Mark as read</span>}
                </Button>
            </div>
        </div>
    );
}
