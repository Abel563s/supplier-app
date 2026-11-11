import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CalendarX2,
    CheckCircle2,
    Eye,
    FileCheck2,
    FileWarning,
    RotateCcw,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface BusinessLicenseSupplier {
    id: number;
    name: string | null;
    trade_name: string | null;
    tin: string | null;
    business_registration_no: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    expiry_date: string | null;
    days_remaining: number | null;
    status: string;
    status_label: string;
    time_remaining: string;
}

interface AdminBusinessLicenseExpiryProps {
    suppliers: {
        data: BusinessLicenseSupplier[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    summary: {
        approved: number;
        expired: number;
        today: number;
        critical: number;
        upcoming: number;
        valid: number;
        missing: number;
        expiring_in_7_days: number;
        expiring_in_30_days: number;
    };
    filters: {
        search: string;
        status: string;
        period: number | null;
    };
    today: string;
    expiryDate: string | null;
}

const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'expired', label: 'Expired' },
    { key: 'today', label: 'Expires Today' },
    { key: 'critical', label: 'Critical' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'valid', label: 'Valid' },
    { key: 'missing', label: 'Missing Date' },
] as const;

const statusStyles: Record<string, string> = {
    expired: 'bg-red-50 text-red-700 ring-red-200',
    today: 'bg-orange-50 text-orange-700 ring-orange-200',
    critical: 'bg-amber-50 text-amber-700 ring-amber-200',
    upcoming: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    valid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    missing: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const summaryCards = [
    { key: 'approved', label: 'Approved Suppliers', hint: 'All suppliers using this date', icon: Users, tone: 'bg-slate-100 text-slate-700' },
    { key: 'expired', label: 'Expired', hint: 'Before today', icon: CalendarX2, tone: 'bg-red-50 text-red-700' },
    { key: 'expiring_in_7_days', label: 'Expiring in 7 Days', hint: 'Including today', icon: AlertTriangle, tone: 'bg-orange-50 text-orange-700' },
    { key: 'expiring_in_30_days', label: 'Expiring in 30 Days', hint: 'Including today', icon: CalendarClock, tone: 'bg-amber-50 text-amber-700' },
    { key: 'valid', label: 'Valid', hint: 'More than 30 days', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
    { key: 'missing', label: 'Missing Date', hint: 'Set a shared expiry date', icon: FileWarning, tone: 'bg-gray-100 text-gray-600' },
] as const;

const formatGregorianDate = (date: string | null) =>
    date ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : '-';

const formatGeezDate = (date: string | null) =>
    date
        ? `${new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
          }).format(new Date(`${date}T00:00:00Z`))} ዓ.ም.`
        : '-';

export default function AdminBusinessLicenseExpiry({ suppliers, summary, filters, today, expiryDate }: AdminBusinessLicenseExpiryProps) {
    const [search, setSearch] = useState(filters.search);
    const [applying, setApplying] = useState(false);
    const expiryForm = useForm({ expiry_date: expiryDate ?? '' });

    const hasActiveFilters = Boolean(filters.search || filters.status !== 'all' || filters.period);

    const applyFilters = (updates: Record<string, string | number | null>) => {
        setApplying(true);

        router.get(
            '/admin/business-license-expiry',
            {
                search: filters.search,
                status: filters.status,
                period: filters.period,
                ...updates,
            },
            { preserveState: true, preserveScroll: true, onFinish: () => setApplying(false) },
        );
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters({ search });
    };

    const handleReset = () => {
        setSearch('');
        setApplying(true);
        router.get('/admin/business-license-expiry', {}, { preserveState: true, preserveScroll: true, onFinish: () => setApplying(false) });
    };

    const handleExpirySubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        expiryForm.put('/admin/business-license-expiry', { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Business License Expiry" />

            <div className="mb-6 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                            <FileCheck2 className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Compliance monitoring</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Business License Expiry</h1>
                            <p className="mt-2 max-w-2xl text-sm text-white/70">
                                Manage one shared expiry date for all approved suppliers and future approvals.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                        <p className="text-xs font-semibold tracking-wider text-white/55 uppercase">Today</p>
                        <p className="mt-1 font-semibold text-white">{formatGregorianDate(today)}</p>
                        <p className="text-xs text-white/70">{formatGeezDate(today)}</p>
                    </div>
                </div>
            </div>

            <Card className="mb-5 rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                    <div className="max-w-2xl">
                        <h2 className="text-base font-semibold text-gray-900">Set the shared expiry date</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Enter the Gregorian date. The Geʻez calendar equivalent is calculated automatically and shown alongside it.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Saving updates the date shown for every approved supplier, including suppliers approved in the future.</p>
                    </div>
                    <form onSubmit={handleExpirySubmit} className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-72">
                        <label htmlFor="business-license-expiry-date" className="text-sm font-medium text-gray-700">
                            Expiry date (Gregorian)
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="business-license-expiry-date"
                                type="date"
                                value={expiryForm.data.expiry_date}
                                onChange={(event) => expiryForm.setData('expiry_date', event.target.value)}
                                aria-invalid={Boolean(expiryForm.errors.expiry_date)}
                                className="h-10 sm:min-w-48"
                            />
                            <Button type="submit" disabled={expiryForm.processing} className="h-10 shrink-0 bg-[#00515F] hover:bg-[#00353D]">
                                {expiryForm.processing ? 'Saving...' : 'Save shared date'}
                            </Button>
                        </div>
                        <InputError message={expiryForm.errors.expiry_date} />
                        {expiryForm.data.expiry_date && (
                            <p className="text-xs text-gray-600">Geʻez date: {formatGeezDate(expiryForm.data.expiry_date)}</p>
                        )}
                    </form>
                </CardContent>
            </Card>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900">Approved supplier summary</h2>
                <p className="text-xs text-gray-500">{filters.search ? `Matching "${filters.search}"` : 'All approved suppliers'} · shared expiry date</p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {summaryCards.map((card) => (
                    <Card key={card.key} className="rounded-2xl border-gray-200/80 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold tracking-wide text-gray-500 uppercase">{card.label}</p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{summary[card.key]}</p>
                                    <p className="mt-0.5 truncate text-[11px] text-gray-400">{card.hint}</p>
                                </div>
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                                    <card.icon className="h-4.5 w-4.5" />
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="mb-5 rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => applyFilters({ status: filter.key })}
                                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filters.status === filter.key ? 'bg-[#00515F] text-white shadow-sm' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <form className="flex min-w-0 gap-2" onSubmit={handleSearchSubmit}>
                                <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search supplier name or TIN..."
                                        className="h-10 w-full rounded-xl border border-gray-300 bg-white pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                    />
                                </div>
                                <Button type="submit" variant="secondary" disabled={applying} className="h-10 rounded-xl px-4">
                                    Search
                                </Button>
                            </form>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={filters.period ?? ''}
                                    onChange={(event) => applyFilters({ period: event.target.value ? Number(event.target.value) : null })}
                                    aria-label="Filter by expiry period"
                                    className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                >
                                    <option value="">Any period</option>
                                    <option value="7">Next 7 days</option>
                                    <option value="30">Next 30 days</option>
                                    <option value="90">Next 90 days</option>
                                </select>
                                {hasActiveFilters && (
                                    <Button type="button" variant="outline" onClick={handleReset} disabled={applying} className="h-10 rounded-xl px-3">
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-3.5 font-semibold text-white">Supplier</th>
                                    <th className="px-6 py-3.5 font-semibold text-white">TIN</th>
                                    <th className="px-6 py-3.5 font-semibold text-white">Contact</th>
                                    <th className="px-6 py-3.5 font-semibold text-white">Expiry Date</th>
                                    <th className="px-6 py-3.5 font-semibold text-white">Time Remaining</th>
                                    <th className="px-6 py-3.5 font-semibold text-white">Status</th>
                                    <th className="px-6 py-3.5 text-right font-semibold text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {suppliers.data.map((supplier) => (
                                    <tr key={supplier.id} className="group hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/suppliers/${supplier.id}`} className="font-semibold text-gray-900 hover:text-[#00515F]">
                                                {supplier.name || 'Unnamed Supplier'}
                                            </Link>
                                            {supplier.trade_name && <p className="text-sm text-gray-500">{supplier.trade_name}</p>}
                                            {supplier.business_registration_no && <p className="text-xs text-gray-400">BRN: {supplier.business_registration_no}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{supplier.tin || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {supplier.contact_name || '-'}
                                            {supplier.contact_phone && <p className="text-xs text-gray-400">{supplier.contact_phone}</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            <p>{formatGregorianDate(supplier.expiry_date)}</p>
                                            <p className="text-xs text-gray-500">{formatGeezDate(supplier.expiry_date)}</p>
                                        </td>
                                        <td
                                            className={`px-6 py-4 whitespace-nowrap ${
                                                supplier.status === 'expired' ? 'font-semibold text-red-600' : supplier.status === 'today' ? 'font-semibold text-orange-600' : 'text-gray-600'
                                            }`}
                                        >
                                            {supplier.time_remaining}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    statusStyles[supplier.status] || 'bg-gray-100 text-gray-700 ring-gray-200'
                                                }`}
                                            >
                                                {supplier.status_label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/suppliers/${supplier.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                                    <Eye className="mr-1.5 h-4 w-4" />
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            {hasActiveFilters ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-gray-700">No suppliers match your filters.</p>
                                                    <p className="text-sm text-gray-500">Try another search or reset the filters.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-gray-700">No approved suppliers found.</p>
                                                    <p className="text-sm text-gray-500">Approved suppliers will appear here.</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                            {suppliers.total > 0 ? `Showing ${suppliers.from} to ${suppliers.to} of ${suppliers.total} suppliers` : 'No suppliers to display'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {suppliers.links.map((link, index) => {
                                const isPrevious = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                const label = isPrevious ? '← Previous' : isNext ? 'Next →' : link.label;

                                return link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                            link.active
                                                ? 'bg-[#00515F] text-white'
                                                : isNext
                                                  ? 'bg-[#00515F] text-white hover:bg-[#00515F]/90'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span key={index} className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm text-gray-400">
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-[#00515F]" />
                The shared expiry date is stored in Gregorian format; its Geʻez calendar equivalent is displayed for reference.
            </p>
        </AdminLayout>
    );
}
