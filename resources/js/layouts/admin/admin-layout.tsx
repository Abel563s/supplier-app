import FlashMessages from '@/components/flash-messages';
import { NotificationButton } from '@/components/notifications/NotificationButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    ClipboardList,
    FileCheck2,
    FilePlus2,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    PanelLeftClose,
    PanelRightOpen,
    ShieldCheck,
    User,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

const navigation: Array<{
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    roles: string[];
    departmentAccess?: boolean;
}> = [
    { name: 'Dashboard', href: '/proc/dashboard', icon: LayoutDashboard, exact: true, roles: ['procurement'] },
    { name: 'Supplier Requests', href: '/proc/request-supplier', icon: FilePlus2, roles: ['procurement'] },
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, exact: true, roles: ['admin'] },
    { name: 'Suppliers', href: '/admin/suppliers', icon: Building2, roles: ['admin'], departmentAccess: true },
    { name: 'Supplier Requests', href: '/admin/supplier-requests', icon: ClipboardList, roles: ['admin'] },
    { name: 'Tax Expiry', href: '/admin/tax-expiry', icon: CalendarClock, roles: ['admin'] },
    { name: 'Business License Expiry', href: '/admin/business-license-expiry', icon: FileCheck2, roles: ['admin'] },
    { name: 'Roles & Access', href: '/admin/roles', icon: ShieldCheck, roles: ['admin'] },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const page = usePage();

    const auth = page.props.auth as {
        user?: { name?: string; email?: string; role?: string };
        roleType?: string;
    };
    const user = auth?.user || {};
    const title = typeof page.props.title === 'string' ? page.props.title : 'Dashboard';
    const userRole = user.role || 'admin';
    const userRoleType = auth?.roleType;
    const suppliersHome = userRoleType === 'department';

    const isActive = (href: string, exact?: boolean) => {
        if (exact) {
            return page.url === href || page.url === href + '/';
        }
        return page.url.startsWith(href);
    };

    const visibleNavigation = navigation.filter((item) => item.roles.includes(userRole) || (item.departmentAccess && userRoleType === 'department'));
    const userInitials = (user.name || (userRole === 'procurement' ? 'Procurement User' : 'Administrator'))
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
            <FlashMessages />
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-linear-to-b from-[#00515F] via-[#00353D] to-black text-white shadow-xl transition-all duration-300 ${
                    collapsed ? 'w-[76px]' : 'w-[276px]'
                }`}
            >
                <div className={`flex h-[88px] shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
                    <Link
                        href={userRole === 'procurement' ? '/proc/dashboard' : suppliersHome ? '/admin/suppliers' : '/admin/dashboard'}
                        title="Ethiopian Engineering Corporation"
                        className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-white/15">
                            <img src="/logo/EEC-logo.jpg" alt="EEC" className="h-full w-full object-contain" />
                        </span>
                        {!collapsed && (
                            <span className="min-w-0 leading-tight">
                                <span className="block truncate text-sm font-bold tracking-wide text-white">EEC</span>
                                <span className="mt-1 block truncate text-[10px] font-semibold tracking-[0.15em] text-white/55 uppercase">
                                    {userRole === 'procurement' ? 'Procurement' : 'Administration'}
                                </span>
                            </span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className={`h-9 w-9 shrink-0 rounded-xl text-white/70 hover:bg-white/10 hover:text-white ${collapsed ? 'absolute top-3 right-[-14px] border border-white/15 bg-[#00444F] shadow-md' : ''}`}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                <div className={`px-3 pb-3 ${collapsed ? 'px-2' : ''}`}>
                    {!collapsed && <p className="px-3 text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">Workspace</p>}
                </div>

                <nav aria-label="Main navigation" className={`flex-1 space-y-1.5 px-3 ${collapsed ? 'px-2' : ''}`}>
                    {visibleNavigation.map((item) => {
                        const active = isActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={collapsed ? item.name : undefined}
                                aria-current={active ? 'page' : undefined}
                                className={`group relative flex min-h-11 items-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                                } ${
                                    active ? 'bg-white text-[#004b56] shadow-lg shadow-black/10' : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {active && !collapsed && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#00515F]" />}
                                <item.icon
                                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                        active ? 'text-[#00899A]' : 'text-white/55 group-hover:text-white'
                                    }`}
                                />
                                {!collapsed && <span className="truncate">{item.name}</span>}
                                {active && collapsed && <span className="absolute right-1.5 bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#52d5df]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`border-t border-white/10 p-3 ${collapsed ? 'px-2' : ''}`}>
                    <div
                        className={`mb-2 flex items-center rounded-xl border border-white/10 bg-white/[0.06] ${collapsed ? 'justify-center p-2' : 'gap-3 p-3'}`}
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00515F]/20 text-xs font-bold text-[#a9f4f6] ring-1 ring-white/10">
                            {userInitials}
                        </span>
                        {!collapsed && (
                            <span className="min-w-0 leading-tight">
                                <span className="block truncate text-sm font-semibold text-white">
                                    {user.name || (userRole === 'procurement' ? 'Procurement User' : 'Administrator')}
                                </span>
                                <span className="mt-1 block truncate text-xs text-white/50">
                                    {user.email || (userRole === 'procurement' ? 'procurement@eec.com.et' : 'admin@eec.com.et')}
                                </span>
                            </span>
                        )}
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        title={collapsed ? 'Log out' : undefined}
                        className={`flex min-h-11 w-full items-center rounded-xl text-sm font-semibold text-white/65 transition-colors hover:bg-red-500/15 hover:text-red-100 ${
                            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                        }`}
                    >
                        <LogOut className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </Link>
                </div>
            </aside>

            <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? 'ml-[76px]' : 'ml-[276px]'}`}>
                <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6 lg:px-8">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.16em] text-gray-400 uppercase">
                                    {userRole === 'procurement' ? 'Procurement workspace' : 'EEC workspace'}
                                </p>
                                <h1 className="mt-0.5 text-sm font-bold text-gray-900">{title}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationButton className="ml-2" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src="" alt={userRole === 'procurement' ? 'Procurement' : 'Admin'} />
                                            <AvatarFallback className="bg-[#00515F]/10 text-[#00515F]">
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} as="button" className="w-full text-left">
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        Help
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/logout" method="post" as="button" className="w-full text-left">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
                    <div className="w-full">{children}</div>
                </main>
            </div>
        </div>
    );
}
