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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin/admin-layout';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import { type Notification } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, Delete, Filter, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface NotificationsPageProps {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    categories: string[];
    filters: {
        search?: string | null;
        category?: string | null;
        date?: string | null;
        unread?: string | null;
    };
    unreadCount: number;
    title: string;
}

const TABS = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Notifications' },
    { value: 'read', label: 'Read Notifications' },
];

export default function NotificationsPage({ notifications, categories, filters, unreadCount, title }: NotificationsPageProps) {
    const page = usePage<{ auth: { user: { id: number; name: string; role: string } } }>();
    const user = page.props.auth.user;
    const isSupplier = user.role === 'supplier';

    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [date, setDate] = useState(filters.date ?? '');
    const [tab, setTab] = useState<string>(filters.unread === 'true' ? 'unread' : 'all');
    const [deleting, setDeleting] = useState<string | null>(null);

    const filtered = notifications.data.filter((n) => {
        const matchesSearch =
            !search ||
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.body.toLowerCase().includes(search.toLowerCase()) ||
            (n.supplier_name && n.supplier_name.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = !category || n.category === category;
        const matchesDate = !date || n.created_at.slice(0, 10) === date;
        const matchesTab = tab === 'all' ? true : tab === 'unread' ? !n.read : n.read;

        return matchesSearch && matchesCategory && matchesDate && matchesTab;
    });

    const unreadTotal = notifications.data.filter((n) => !n.read).length;

    const markAsRead = (id: string) => {
        router.patch(`/notifications/${id}/read`, {
            preserveScroll: true,
            onError: () => {},
        });
    };

    const markAllAsRead = () => {
        router.patch('/notifications/read-all', {
            preserveScroll: true,
            onError: () => {},
        });
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Dismiss this notification?')) {
            return;
        }

        setDeleting(id);
        router.delete(`/notifications/${id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
            onError: () => setDeleting(null),
        });
    };

    const content = (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-600">Manage your notifications. Unread notifications are highlighted.</p>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:w-96">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="search"
                        placeholder="Search notifications…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="relative flex-1 sm:w-64">
                    <Filter className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearch('');
                            setCategory('');
                            setDate('');
                            setTab('all');
                        }}
                        disabled={!search && !category && !date && tab === 'all'}
                    >
                        Reset
                    </Button>
                    <Button onClick={markAllAsRead} disabled={unreadTotal === 0}>
                        Mark all as read
                    </Button>
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="mb-6 w-full">
                <TabsList className="w-full">
                    {TABS.map((item) => (
                        <TabsTrigger key={item.value} value={item.value} className="flex-1 text-sm">
                            {item.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {TABS.map((item) => (
                    <TabsContent key={item.value} value={item.value} className="mt-3">
                        {item.value === 'all' && (
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-900">Category filter</span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8">
                                            {category ? (categories.find((c) => c === category) ?? category.replace(/_/g, ' ')) : 'All categories'}
                                            <span className="ml-1 text-xs opacity-60">▾</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64">
                                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setCategory('')}
                                            className={category === '' ? 'bg-[#00515F]/10 font-semibold text-[#00515F]' : ''}
                                        >
                                            All
                                        </DropdownMenuItem>
                                        {categories.map((cat) => (
                                            <DropdownMenuItem
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                className={category === cat ? 'bg-[#00515F]/10 font-semibold text-[#00515F]' : ''}
                                            >
                                                {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                <span>
                    Showing {filtered.length} of {notifications.total} notification {notifications.total !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5" />
                    {unreadCount} unread
                </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <h3 className="text-sm font-semibold text-gray-900">No notifications found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {tab === 'unread' ? "You're all caught up." : 'Try adjusting your search or filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((notification) => (
                            <div key={notification.id} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-gray-50">
                                <NotificationItem notification={notification} compact />
                                <div className="ml-auto flex items-end gap-2">
                                    {!notification.read && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => markAsRead(notification.id)}
                                            className="h-8 text-[#00515F] hover:bg-[#00ADC5]/10"
                                        >
                                            Mark read
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(notification.id)}
                                        disabled={deleting === notification.id}
                                        className="h-8 text-gray-500 hover:text-red-600"
                                        aria-label="Dismiss notification"
                                    >
                                        {deleting === notification.id ? (
                                            <Trash2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Delete className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {notifications.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="-mx-2 -my-2 flex">
                        {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map((p) => (
                            <Button
                                key={p}
                                variant={notifications.current_page === p ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    router.get(window.location.pathname, { page: p }, { preserveScroll: true });
                                }}
                                className="mx-1"
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                    <span className="text-sm text-gray-600">
                        Page {notifications.current_page} of {notifications.last_page}
                    </span>
                </div>
            )}
        </>
    );

    return isSupplier ? (
        <SupplierLayout currentStep={1} isDashboard>
            {content}
        </SupplierLayout>
    ) : (
        <AdminLayout>{content}</AdminLayout>
    );
}
