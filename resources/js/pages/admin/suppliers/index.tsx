import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, CheckCircle2, Clock3, Download, FileSpreadsheet, Pencil, Plus, Search, ShieldAlert, Trash2, Upload, Users } from 'lucide-react';
import { useCallback, useRef, useState, type FormEvent, type UIEvent } from 'react';

const supplierColumnWidths = [
    { width: '4%', key: 'number' },
    { width: '17%', key: 'supplier' },
    { width: '10%', key: 'tin' },
    { width: '14%', key: 'category' },
    { width: '11%', key: 'procurement' },
    { width: '9%', key: 'status' },
    { width: '12%', key: 'approval' },
    { width: '9%', key: 'submitted' },
    { width: '14%', key: 'actions' },
];

interface SupplierGrades {
    [procurementType: string]: Record<string, number> | undefined;
}

interface AdminSuppliersProps {
    suppliers: {
        data: Array<{
            id: number;
            legal_name: string;
            trade_name: string;
            tin: string | null;
            primary_contact_name: string;
            primary_phone: string;
            primary_business_category: string;
            procurement_type: string | null;
            sub_category: string;
            specialization: string;
            procurement_grades: SupplierGrades | null;
            approval_department: string | null;
            approval_stage: string;
            department_review_status: string | null;
            department_reviews: Array<{
                department: string;
                status: string;
                department_role: { name: string } | null;
            }>;
            status: string;
            created_at: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
    stats: {
        total: number;
        submitted: number;
        pending: number;
        needs_correction: number;
        approved: number;
        rejected: number;
    };
    isAdmin: boolean;
    departmentName: string | null;
    departments: Record<string, string>;
}

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    under_review: 'bg-amber-50 text-amber-700',
    needs_correction: 'bg-orange-50 text-orange-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
};

const procurementTypeLabels: Record<string, string> = {
    supply: 'Supply',
    service: 'Service',
    consulting: 'Consulting',
    'non-consulting': 'Non-consulting',
};

const procurementTypeLabel = (type: string | null | undefined): string =>
    (type ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => procurementTypeLabels[value] ?? value)
        .join(', ') || '-';

const tabs = [
    { key: null, label: 'All' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'needs_correction', label: 'Needs Correction' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
] as const;

export default function AdminSuppliers({ suppliers, filters, stats, isAdmin, departmentName, departments }: AdminSuppliersProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm<{
        file: File | null;
    }>({
        file: null,
    });

    const tableHeaderRef = useRef<HTMLDivElement>(null);
    const tableBodyRef = useRef<HTMLDivElement>(null);

    const syncTableScroll = useCallback((source: 'header' | 'body') => (event: UIEvent<HTMLDivElement>) => {
        const from = event.currentTarget;
        const to = source === 'header' ? tableBodyRef.current : tableHeaderRef.current;

        if (to && to.scrollLeft !== from.scrollLeft) {
            to.scrollLeft = from.scrollLeft;
        }
    }, []);

    const handleSearch = () => {
        setSubmitting(true);
        router.get('/admin/suppliers', { search, status: filters.status }, { preserveScroll: true, onFinish: () => setSubmitting(false) });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setIsDeleting(true);
        router.delete(`/admin/suppliers/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteId(null);
            },
        });
    };

    const handleImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        postImport('/admin/suppliers/import', {
            forceFormData: true,
            onSuccess: () => {
                resetImport();
                setImportOpen(false);
            },
        });
    };

    const tabCounts: Record<string, number> = {
        all: stats.total,
        pending: stats.pending,
        needs_correction: stats.needs_correction,
        approved: stats.approved,
        rejected: stats.rejected,
    };

    const activeTab = filters.status || 'all';

    return (
        <AdminLayout>
            <Head title="Suppliers" />

            <div className="mb-6 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                            <Building2 className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Directory & review</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Supplier management</h1>
                            <p className="mt-2 text-sm text-white/70">
                                {isAdmin
                                    ? 'Review registration details, track status, and maintain the EEC supplier directory.'
                                    : `Suppliers assigned to ${departmentName ?? 'your department'} for review.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex w-fit flex-wrap items-center gap-2">
                        {isAdmin && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setImportOpen(true)}
                                    className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                                >
                                    <Upload className="h-4 w-4" />
                                    Import suppliers
                                </Button>
                                <Link
                                    href="/admin/suppliers/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#00515F] shadow-sm transition hover:bg-white/90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add supplier
                                </Link>
                            </>
                        )}
                        <Link
                            href="/admin/suppliers?status=pending"
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            Review queue
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <Dialog
                open={importOpen}
                onOpenChange={(open) => {
                    setImportOpen(open);

                    if (!open && !importProcessing) {
                        resetImport();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import suppliers</DialogTitle>
                        <DialogDescription>
                            Import supplier registrations using an Excel or CSV file with the same fields as the Add Supplier form. All rows are validated before any suppliers are created.
                        </DialogDescription>
                    </DialogHeader>
                    <a
                        href="/admin/suppliers/import/template"
                        className="flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900 transition hover:bg-teal-100"
                    >
                        <span className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 shrink-0" />
                            <span>
                                <span className="block font-semibold">Download Excel template</span>
                                <span className="block text-xs text-teal-800">Use the supplied column names. Separate multiple procurement types with semicolons.</span>
                            </span>
                        </span>
                        <Download className="h-4 w-4 shrink-0" />
                    </a>
                    <form id="supplier-import-form" onSubmit={handleImport} className="space-y-3">
                        <label htmlFor="supplier-import-file" className="text-sm font-medium text-gray-900">
                            Supplier CSV file
                        </label>
                        <Input
                            id="supplier-import-file"
                            type="file"
                            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            onChange={(event) => setImportData('file', event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-gray-500">Excel (.xlsx) or CSV, up to 10 MB and 500 supplier rows. Boolean values: true/false. Dates: YYYY-MM-DD.</p>
                        {importErrors.file && (
                            <p role="alert" className="whitespace-pre-line text-sm text-red-600">
                                {importErrors.file}
                            </p>
                        )}
                    </form>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setImportOpen(false)} disabled={importProcessing}>
                            Cancel
                        </Button>
                        <Button type="submit" form="supplier-import-form" disabled={importProcessing || !importData.file}>
                            {importProcessing ? 'Importing...' : 'Import suppliers'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[
                    { label: 'Total suppliers', value: stats.total, icon: Users, tone: 'bg-slate-100 text-slate-700' },
                    { label: 'Awaiting review', value: stats.pending, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Needs correction', value: stats.needs_correction, icon: ShieldAlert, tone: 'bg-orange-50 text-orange-700' },
                    { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
                ].map((stat) => (
                    <Card key={stat.label} className="rounded-2xl border-gray-200/80 shadow-sm">
                        <CardContent className="flex items-center justify-between p-4 sm:p-5">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{stat.label}</p>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                            </div>
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                                <stat.icon className="h-5 w-5" />
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="mb-5 rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {tabs.map((tab) => {
                                const count = tabCounts[tab.key || 'all'] || 0;
                                const isActive = activeTab === (tab.key || 'all');
                                return (
                                    <Link
                                        key={tab.key || 'all'}
                                        href={tab.key ? `/admin/suppliers?status=${tab.key}` : '/admin/suppliers'}
                                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                            isActive ? 'bg-[#00515F] text-white shadow-sm' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab.label}
                                        <span
                                            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                        <form
                            className="flex min-w-0 gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                            }}
                        >
                            <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search suppliers..."
                                    className="h-10 w-full rounded-xl pl-9"
                                />
                            </div>
                            <Button type="submit" variant="secondary" disabled={submitting} className="h-10 rounded-xl px-4">
                                Search
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-0">
                    <div ref={tableHeaderRef} onScroll={syncTableScroll('header')} className="overflow-x-auto">
                        <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
                            <colgroup>
                                {supplierColumnWidths.map((column) => (
                                    <col key={column.key} style={{ width: column.width }} />
                                ))}
                            </colgroup>
                            <thead className="bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                <tr className="border-b border-white/10">
                                    <th className="py-4 pr-3 pl-5 text-xs font-bold tracking-wide text-white/80 uppercase">#</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Supplier</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">TIN</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Category</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Procurement</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Status</th>
                                    <th className="px-5 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Assigned Department / Review</th>
                                    <th className="whitespace-nowrap px-4 py-4 pr-3 text-xs font-bold tracking-wide text-white/80 uppercase">Submitted</th>
                                    <th className="whitespace-nowrap px-4 py-4 pr-5 text-right text-xs font-bold tracking-wide text-white/80 uppercase">Actions</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        ref={tableBodyRef}
                        onScroll={syncTableScroll('body')}
                        className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto"
                    >
                        <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
                            <colgroup>
                                {supplierColumnWidths.map((column) => (
                                    <col key={column.key} style={{ width: column.width }} />
                                ))}
                            </colgroup>
                            <tbody className="divide-y divide-gray-100">
                                {suppliers.data.map((supplier, index) => (
                                    <tr key={supplier.id} className="group transition-colors even:bg-slate-50/50 hover:bg-teal-50/70">
                                        <td className="py-4 pr-3 pl-5 font-mono text-xs text-gray-400">{suppliers.from + index}</td>
                                        <td className="px-5 py-4 pr-3">
                                            <div>
                                                <Link
                                                    href={`/admin/suppliers/${supplier.id}`}
                                                    className="font-semibold text-gray-900 hover:text-[#00515F]"
                                                >
                                                    {supplier.legal_name}
                                                </Link>
                                                {supplier.trade_name && <p className="text-sm text-gray-500">{supplier.trade_name}</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 pr-3 font-mono text-xs text-gray-500">{supplier.tin || '-'}</td>
                                        <td className="px-5 py-4 pr-3 text-gray-700">{supplier.primary_business_category || '-'}</td>
                                        <td className="px-5 py-4 pr-3 text-gray-600">{procurementTypeLabel(supplier.procurement_type)}</td>
                                        <td className="px-5 py-4 pr-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[supplier.status] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {['pending', 'under_review'].includes(supplier.status)
                                                    ? 'Pending'
                                                    : supplier.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 pr-3">
                                            {supplier.department_reviews.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {supplier.department_reviews.map((review) => (
                                                        <span
                                                            key={review.department}
                                                            className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-gray-700"
                                                        >
                                                            {review.department_role?.name ?? departments[review.department] ?? review.department}
                                                            {' · '}
                                                            {review.status === 'completed' ? 'Approved' : 'Pending'}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="font-medium text-gray-800">Not assigned</p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 pr-3 text-gray-600">
                                            {supplier.created_at
                                                ? new Date(supplier.created_at).toLocaleDateString('en-GB', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 pr-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {isAdmin && (
                                                    <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#00515F] hover:text-[#00353D]" title="Edit supplier">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Link href={`/admin/suppliers/${supplier.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                                        Review
                                                        <span className="ml-1">→</span>
                                                    </Button>
                                                </Link>
                                                {isAdmin && (
                                                    <span className="inline-flex opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                                                        <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                                                onClick={() => setDeleteId(supplier.id)}
                                                                title="Delete supplier"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Delete Supplier</DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure you want to delete <strong>{supplier.legal_name}</strong>? This action
                                                                    cannot be undone.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button variant="outline" disabled={isDeleting}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleDelete}
                                                                    disabled={isDeleting}
                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                >
                                                                    {isDeleting && deleteId === supplier.id ? 'Deleting...' : 'Delete'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                        </Dialog>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No suppliers found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                        <p className="text-sm text-gray-500">
                            Showing {suppliers.from} to {suppliers.to} of {suppliers.total} suppliers
                        </p>
                        <div className="flex items-center gap-2">
                            {suppliers.links.map((link, index) => {
                                if (link.label.includes('Previous')) {
                                    if (!link.url) {
                                        return (
                                            <span key={index} className="cursor-not-allabled rounded-lg px-3 py-1.5 text-sm text-gray-400">
                                                ← Previous
                                            </span>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                                        >
                                            ← Previous
                                        </Link>
                                    );
                                }
                                if (link.label.includes('Next')) {
                                    if (!link.url) {
                                        return (
                                            <span key={index} className="cursor-not-allabled rounded-lg px-3 py-1.5 text-sm text-gray-400">
                                                Next →
                                            </span>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className="rounded-lg bg-[#00515F] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#00515F]/90"
                                        >
                                            Next →
                                        </Link>
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                            link.active ? 'bg-[#00515F] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
