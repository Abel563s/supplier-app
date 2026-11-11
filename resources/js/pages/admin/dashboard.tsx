import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileText, ShieldCheck, Users, XCircle } from 'lucide-react';

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

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    under_review: 'bg-amber-50 text-amber-700',
    needs_correction: 'bg-orange-50 text-orange-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
};

export default function AdminDashboard({ stats, recent }: AdminDashboardProps) {
    const kpis = [
        { label: 'Total suppliers', value: stats.total, href: '/admin/suppliers', icon: Users, color: 'text-slate-700', bg: 'bg-slate-100' },
        {
            label: 'Pending approval',
            value: stats.under_review,
            href: '/admin/suppliers?status=pending',
            icon: Clock,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
        },
        {
            label: 'Needs correction',
            value: stats.needs_correction,
            href: '/admin/suppliers?status=needs_correction',
            icon: AlertTriangle,
            color: 'text-orange-700',
            bg: 'bg-orange-50',
        },
        {
            label: 'Approved',
            value: stats.approved,
            href: '/admin/suppliers?status=approved',
            icon: CheckCircle2,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Rejected',
            value: stats.rejected,
            href: '/admin/suppliers?status=rejected',
            icon: XCircle,
            color: 'text-rose-700',
            bg: 'bg-rose-50',
        },
        {
            label: 'Documents pending',
            value: stats.documents_pending,
            href: '/admin/suppliers',
            icon: FileText,
            color: 'text-sky-700',
            bg: 'bg-sky-50',
        },
    ];

    const pendingSuppliers = recent.filter((s) => ['submitted', 'pending', 'under_review'].includes(s.status));
    const hasPending = pendingSuppliers.length > 0;

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="mb-7 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#8de1e9]" />
                            EEC administration
                        </span>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Supplier administration</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                            Monitor registrations, resolve pending reviews, and keep the supplier directory up to date.
                        </p>
                    </div>
                    <Link
                        href="/admin/suppliers"
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#00515F] transition hover:bg-white/90"
                    >
                        Open supplier directory
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpis.map((kpi) => (
                    <Link key={kpi.label} href={kpi.href}>
                        <Card className="h-full rounded-2xl border-gray-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{kpi.label}</p>
                                        <p className="mt-3 text-3xl leading-none font-bold tracking-tight text-gray-900">{kpi.value}</p>
                                    </div>
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.bg}`}>
                                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Card className="rounded-2xl border-gray-200/80 shadow-sm lg:col-span-1">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-900">Registration Overview</CardTitle>
                        <p className="text-sm text-gray-500">Distribution by current status</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: 'Draft', value: stats.draft, color: 'bg-gray-400' },
                                { label: 'Submitted', value: stats.submitted, color: 'bg-blue-500' },
                                { label: 'Pending Approval', value: stats.under_review, color: 'bg-amber-500' },
                                { label: 'Needs Correction', value: stats.needs_correction, color: 'bg-orange-500' },
                                { label: 'Approved', value: stats.approved, color: 'bg-emerald-500' },
                                { label: 'Rejected', value: stats.rejected, color: 'bg-red-500' },
                            ].map((item) => {
                                const total = stats.total || 1;
                                const pct = Math.round((item.value / total) * 100);
                                return (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={`h-2.5 flex-1 rounded-full bg-gray-100`}>
                                            <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="w-28 text-sm text-gray-600">{item.label}</span>
                                        <span className="w-8 text-right text-sm font-semibold text-gray-900">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-200/80 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-gray-900">Pending Supplier Reviews</CardTitle>
                                <p className="text-sm text-gray-500">Suppliers awaiting department approval</p>
                            </div>
                            <Link href="/admin/suppliers?status=pending">
                                <Button variant="ghost" className="text-sm text-[#00515F] hover:text-[#00353D]">
                                    View All
                                    <span className="ml-1">→</span>
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!hasPending ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                <p className="mt-4 text-base font-medium text-gray-900">All caught up</p>
                                <p className="mt-1 text-sm text-gray-500">All supplier registrations are currently reviewed.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {pendingSuppliers.slice(0, 5).map((supplier) => (
                                    <div key={supplier.id} className="flex items-center justify-between py-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-base font-semibold text-gray-900">{supplier.legal_name}</p>
                                            {supplier.trade_name && <p className="truncate text-sm text-gray-500">{supplier.trade_name}</p>}
                                        </div>
                                        <div className="ml-4 flex items-center gap-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[supplier.status] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {['pending', 'under_review'].includes(supplier.status)
                                                    ? 'Pending'
                                                    : supplier.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(supplier.created_at).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            <Link href={`/admin/suppliers/${supplier.id}`}>
                                                <Button size="sm" className="bg-[#00515F] text-white hover:bg-[#00515F]/90">
                                                    Review
                                                    <span className="ml-1">→</span>
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6 overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Supplier Registrations</CardTitle>
                    <p className="text-sm text-gray-500">Latest registrations across all statuses</p>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="border-b border-gray-200">
                                    <th className="pr-4 pb-3 font-medium text-gray-500">Supplier</th>
                                    <th className="pr-4 pb-3 font-medium text-gray-500">Status</th>
                                    <th className="pr-4 pb-3 font-medium text-gray-500">Submitted</th>
                                    <th className="pb-3 text-right font-medium text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recent.map((item) => (
                                    <tr key={item.id} className="group">
                                        <td className="py-4 pr-4">
                                            <p className="font-semibold text-gray-900">{item.legal_name}</p>
                                            {item.trade_name && <p className="text-sm text-gray-500">{item.trade_name}</p>}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {['pending', 'under_review'].includes(item.status)
                                                    ? 'Pending'
                                                    : item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-600">
                                            {new Date(item.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Link href={`/admin/suppliers/${item.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                                    View
                                                    <span className="ml-1">→</span>
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
