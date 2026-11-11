import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    ShieldCheck,
    ShieldAlert,
    Users,
    XCircle,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';

interface AdminDashboardProps {
    stats: {
        total: number;
        draft: number;
        submitted: number;
        under_review: number;
        needs_correction: number;
        approved: number;
        rejected: number;
        documents_pending: number;
    };
    recent: Array<{
        id: number;
        legal_name: string;
        trade_name?: string;
        status: string;
        created_at: string;
    }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
    submitted: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    needs_correction: { label: 'Needs Correction', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
    approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    rejected: { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
};

const statusDistribution = [
    { key: 'draft', label: 'Draft', color: 'bg-gray-400' },
    { key: 'submitted', label: 'Submitted', color: 'bg-blue-500' },
    { key: 'under_review', label: 'Pending Approval', color: 'bg-amber-500' },
    { key: 'needs_correction', label: 'Needs Correction', color: 'bg-orange-500' },
    { key: 'approved', label: 'Approved', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export default function AdminDashboard({ stats, recent }: AdminDashboardProps) {
    const total = stats.total || 1;
    const completionRate = Math.round((stats.approved / total) * 100);

    const kpis = [
        {
            label: 'Total Suppliers',
            value: stats.total,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 border-indigo-200',
            trend: '+12%',
            trendDirection: 'up' as const,
            href: '/admin/suppliers',
        },
        {
            label: 'Pending Approval',
            value: stats.under_review,
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-50 border-amber-200',
            trend: '+4%',
            trendDirection: 'up' as const,
            href: '/admin/suppliers?status=under_review',
        },
        {
            label: 'Needs Correction',
            value: stats.needs_correction,
            icon: AlertTriangle,
            color: 'text-orange-500',
            bg: 'bg-orange-50 border-orange-200',
            trend: '-2%',
            trendDirection: 'down' as const,
            href: '/admin/suppliers?status=needs_correction',
        },
        {
            label: 'Approved',
            value: stats.approved,
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 border-emerald-200',
            trend: '+8%',
            trendDirection: 'up' as const,
            href: '/admin/suppliers?status=approved',
        },
        {
            label: 'Rejected',
            value: stats.rejected,
            icon: XCircle,
            color: 'text-rose-500',
            bg: 'bg-rose-50 border-rose-200',
            trend: '-1%',
            trendDirection: 'down' as const,
            href: '/admin/suppliers?status=rejected',
        },
        {
            label: 'Documents Pending',
            value: stats.documents_pending,
            icon: FileText,
            color: 'text-sky-500',
            bg: 'bg-sky-50 border-sky-200',
            trend: '+6%',
            trendDirection: 'up' as const,
            href: '/admin/suppliers',
        },
    ];

    const pendingSuppliers = recent.filter(
        (s) => ['submitted', 'pending', 'under_review', 'needs_correction'].includes(s.status),
    );
    const hasPending = pendingSuppliers.length > 0;

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            {/* Hero section */}
            <div className="mb-8 overflow-hidden rounded-3xl border border-teal-200/60 bg-gradient-to-b from-[#00515F]/90 via-[#00444F] to-[#00515F] text-white shadow-lg">
                <div className="px-6 py-8 sm:px-8 lg:px-10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#8de1e9]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                EEC Supplier Administration
                            </div>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Supplier dashboard</h1>
                            <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
                                Monitor registrations, resolve pending reviews, and keep the supplier directory up to date.
                            </p>
                        </div>
                        <Link
                            href="/admin/suppliers"
                            className="mt-6 sm:mt-0 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#00515F] shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                        >
                            Open supplier directory
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpis.map((kpi) => (
                    <Link
                        key={kpi.label}
                        href={kpi.href}
                        className="block"
                    >
                        <Card className="h-full rounded-2xl border-border/60 bg-background shadow-sm transition-all hover:border-[#00515F]/40 hover:shadow-md hover:-translate-y-1">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{kpi.label}</p>
                                        <p className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                                            <span className={`ml-1 text-xs font-semibold ${
                                                kpi.trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {kpi.trendDirection === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                                {kpi.trend}
                                            </span>
                                        </p>
                                    </div>
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${kpi.bg} shadow-sm`}
                                    >
                                        <kpi.icon className={`h-5 w-5 shrink-0 ${kpi.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Overview + Pending reviews */}
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {/* Registration overview */}
                <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-1">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[#00515F]" />
                            <CardTitle className="text-lg font-semibold text-foreground">Registration Overview</CardTitle>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">Distribution by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                        <div className="space-y-3">
                            {statusDistribution.map((item) => {
                                const value = (stats as Record<string, number>)[item.key] ?? 0;
                                const pct = Math.round((value / total) * 100);
                                return (
                                    <div key={item.key} className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full ${item.color}" />
                                        <span className="w-24 text-sm text-muted-foreground">{item.label}</span>
                                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} transition-all duration-700`}
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-xs font-semibold text-foreground">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 border-t border-border pt-3">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">Approval rate</span>
                                <span className="text-foreground">{completionRate}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-[#00515F]" style={{ width: `${completionRate}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending reviews */}
                <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                <CardTitle className="text-lg font-semibold text-foreground">Pending Supplier Reviews</CardTitle>
                            </div>
                            <Link href="/admin/suppliers?status=under_review">
                                <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                    View all
                                    <span className="ml-1">→</span>
                                </Button>
                            </Link>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">Suppliers awaiting department approval</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                        {!hasPending ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                                <h3 className="mt-4 text-base font-semibold text-foreground">All caught up</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    All supplier registrations are currently reviewed.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {pendingSuppliers.slice(0, 5).map((supplier) => {
                                    const config = statusConfig[supplier.status] || statusConfig.draft;
                                    return (
                                        <div key={supplier.id} className="flex items-center justify-between py-4">
                                            <div className="min-w-0 flex-1 pr-4">
                                                <p className="truncate text-base font-semibold text-foreground">
                                                    {supplier.legal_name}
                                                </p>
                                                {supplier.trade_name && (
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {supplier.trade_name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 ml-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}
                                                >
                                                    {config.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(supplier.created_at)}
                                                </span>
                                                <Link href={`/admin/suppliers/${supplier.id}`}>
                                                    <Button size="sm" className="bg-[#00515F] text-white hover:bg-[#00515F]/90 shadow-sm hover:shadow-md transition">
                                                        Review
                                                        <span className="ml-1">→</span>
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent registrations table */}
            <Card className="mt-6 overflow-hidden rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[#00515F]" />
                            <CardTitle className="text-lg font-semibold text-foreground">Recent Supplier Registrations</CardTitle>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">Latest registrations across all statuses</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-[#00515F] via-[#00353D] to-black text-white">
                                <tr>
                                    <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Supplier</th>
                                    <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Status</th>
                                    <th className="h-11 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Submitted</th>
                                    <th className="h-11 px-4 text-right text-xs font-semibold tracking-wider uppercase text-white">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="h-32 flex flex-col items-center justify-center text-center">
                                            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground">No registrations yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    recent.slice(0, 10).map((item) => {
                                        const config = statusConfig[item.status] || statusConfig.draft;
                                        return (
                                            <tr key={item.id} className="group hover:bg-accent transition-colors">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-medium text-foreground truncate">
                                                            {item.legal_name}
                                                        </p>
                                                        {item.trade_name && (
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {item.trade_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}
                                                    >
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                                                    {formatDate(item.created_at)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Link href={`/admin/suppliers/${item.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                                            View
                                                            <span className="ml-1">→</span>
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
