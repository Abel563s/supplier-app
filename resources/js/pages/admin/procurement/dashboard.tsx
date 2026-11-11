import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FilePlus2,
    Layers3,
    Plus,
    SearchCheck,
    XCircle,
} from 'lucide-react';

interface ProcurementDashboardProps {
    stats: {
        total: number;
        draft: number;
        submitted: number;
        under_review: number;
        approved: number;
        rejected: number;
        cancelled: number;
    };
    recent: Array<{
        id: number;
        primary_business_category: string;
        subcategory: string | null;
        procurement_type: string;
        number_of_suppliers_required: number;
        status: string;
        submitted_at: string | null;
        created_at: string;
    }>;
    userName: string;
}

const statusStyles: Record<string, { label: string; badge: string; dot: string; bar: string }> = {
    draft: { label: 'Draft', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', bar: 'bg-slate-400' },
    submitted: { label: 'Submitted', badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', bar: 'bg-sky-500' },
    under_review: { label: 'Under review', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-500' },
    approved: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
    rejected: { label: 'Rejected', badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', bar: 'bg-rose-500' },
    cancelled: { label: 'Cancelled', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', bar: 'bg-gray-400' },
};

const formatDate = (date: string | null) => {
    if (!date) {
        return 'Not submitted';
    }

    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const requestNumber = (id: number) => `PR-${String(id).padStart(6, '0')}`;

export default function ProcurementDashboard({ stats, recent, userName }: ProcurementDashboardProps) {
    const cards = [
        { label: 'Total requests', value: stats.total, icon: ClipboardList, tone: 'bg-indigo-50 border-indigo-200', iconColor: 'text-indigo-600', caption: 'All your requests' },
        { label: 'Awaiting review', value: stats.submitted, icon: Clock3, tone: 'bg-sky-50 border-sky-200', iconColor: 'text-sky-500', caption: 'Submitted to procurement' },
        { label: 'In review', value: stats.under_review, icon: SearchCheck, tone: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-500', caption: 'Currently being assessed' },
        { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-500', caption: 'Ready for next steps' },
    ];

    const statusBreakdown = [
        { key: 'submitted', value: stats.submitted },
        { key: 'under_review', value: stats.under_review },
        { key: 'approved', value: stats.approved },
        { key: 'draft', value: stats.draft },
        { key: 'rejected', value: stats.rejected },
        { key: 'cancelled', value: stats.cancelled },
    ];

    const latestRequests = recent.slice(0, 10);

    return (
        <AdminLayout>
            <Head title="Procurement Dashboard" />

            <div className="space-y-7 pb-8">
                <section className="relative overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                    <div className="pointer-events-none absolute -top-24 right-[-4rem] h-72 w-72 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -top-12 right-8 h-56 w-56 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute right-20 bottom-[-8rem] h-64 w-64 rounded-full bg-[#00515F]/15 blur-3xl" />
                    <div className="relative flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7ee4ea]" />
                                EEC procurement workspace
                            </div>
                            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back{userName ? `, ${userName}` : ''}</h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                                Keep your procurement requests moving. Review progress, follow supplier matching, and create a request when you need
                                one.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/proc/request-supplier"
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#00515F] shadow-sm transition hover:bg-white/90"
                            >
                                <Plus className="h-4 w-4" />
                                New supplier request
                            </Link>
                            <Link
                                href="/proc/request-supplier"
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                <ClipboardList className="h-4 w-4" />
                                View my requests
                            </Link>
                        </div>
                    </div>
                    <div className="relative grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <Layers3 className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/75">Plan supplier requirements</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <SearchCheck className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/75">Track review and matching</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <CheckCircle2 className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/75">Follow approved suppliers</span>
                        </div>
                    </div>
                </section>

                <section aria-label="Request summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {cards.map((card) => (
                        <Card key={card.label} className="rounded-2xl border-border/60 bg-background shadow-sm transition-all hover:border-[#00515F]/40 hover:shadow-md hover:-translate-y-1">
                            <CardContent className="flex items-start justify-between p-5 sm:p-6">
                                <div>
                                    <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{card.label}</p>
                                    <p className="mt-2 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-foreground">{card.value}</span>
                                    </p>
                                    <p className="mt-1.5 text-xs text-muted-foreground">{card.caption}</p>
                                </div>
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.tone} shadow-sm`}>
                                    <card.icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Recent requests</h2>
                                <p className="mt-1 text-sm text-muted-foreground">A quick look at your latest procurement activity.</p>
                            </div>
                            <Link
                                href="/proc/request-supplier"
                                className="hover:bg-teal/10 inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#00515F] transition"
                            >
                                All requests
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        {recent.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <span className="bg-teal/10 flex h-14 w-14 items-center justify-center rounded-2xl text-[#00515F]">
                                    <FilePlus2 className="h-7 w-7" />
                                </span>
                                <h3 className="mt-4 text-base font-bold text-foreground">Start with your first request</h3>
                                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                                    Describe your supplier needs and requirements to begin the procurement review process.
                                </p>
                                <Link
                                    href="/proc/request-supplier"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00515F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003f49]"
                                >
                                    Create a request
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-[#00515F] via-[#00353D] to-black text-white">
                                        <tr>
                                            <th className="h-10 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Request</th>
                                            <th className="h-10 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Category</th>
                                            <th className="h-10 px-4 text-left text-xs font-semibold tracking-wider uppercase text-white">Status</th>
                                            <th className="h-10 px-4 text-right text-xs font-semibold tracking-wider uppercase text-white">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {latestRequests.map((request) => {
                                            const status = statusStyles[request.status] ?? statusStyles.draft;

                                            return (
                                                <tr key={request.id} className="group hover:bg-accent transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-foreground truncate block">{requestNumber(request.id)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-muted-foreground truncate block">
                                                            {request.primary_business_category}
                                                            {request.subcategory ? ` · ${request.subcategory}` : ''}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${status.badge}`}
                                                        key={status.label}
                                                        data-status={request.status}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap block">
                                                            {formatDate(request.submitted_at)}
                                                        </span>
                                                        <Link
                                                            href={`/proc/requests/${request.id}`}
                                                            className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#00515F] hover:text-[#00353D] transition"
                                                        >
                                                            View
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <div className="space-y-6">
                        <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
                            <div className="border-b border-border px-5 py-5">
                                <h2 className="text-base font-bold text-foreground">Request pipeline</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Status of your procurement requests</p>
                            </div>
                            <CardContent className="space-y-4 p-5">
                                {statusBreakdown.map(({ key, value }) => {
                                    const status = statusStyles[key];
                                    const percentage = stats.total ? Math.round((value / stats.total) * 100) : 0;

                                    return (
                                        <div key={key}>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                                    {status.label}
                                                </span>
                                                <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                                                <div
                                                    className={`h-full rounded-full transition-all ${status.bar}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card className="border-teal/20 overflow-hidden rounded-2xl bg-[#f4fbfb] shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#00515F] shadow-sm">
                                        <FilePlus2 className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-foreground">Need suppliers for a new project?</h2>
                                        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                                            Set clear eligibility and compliance criteria to help the team find a suitable match.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/proc/request-supplier"
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00515F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003f49]"
                                >
                                    Start a supplier request
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </CardContent>
                        </Card>

                        {(stats.rejected > 0 || stats.cancelled > 0) && (
                            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                <p className="text-xs leading-5 text-rose-800">
                                    {stats.rejected} rejected and {stats.cancelled} cancelled {stats.total === 1 ? 'request' : 'requests'} are
                                    included in your totals. Open your requests to review their status.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
