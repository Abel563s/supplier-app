import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, ClipboardList, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SupplierRequest {
    id: number;
    procurement_type: string;
    procurement_method: string | null;
    number_of_suppliers_required: number;
    status: string;
    created_at: string;
    user: { name: string };
    category?: { name: string };
    subcategory?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedRequests {
    data: SupplierRequest[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface AdminSupplierRequestsProps {
    requests: PaginatedRequests;
    filters: {
        status?: string;
    };
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-50 text-blue-700',
    under_review: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
};

const procurementMethodLabel = (method: string | null) => {
    if (method === 'rfq') return 'RFQ';
    if (method === 'itb') return 'ITB';
    if (method === 'rfp') return 'RFP';
    return method || '-';
};

const tabs = [
    { key: null, label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
] as const;

export default function AdminSupplierRequests({ requests, filters }: AdminSupplierRequestsProps) {
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleStatusFilter = (status: string | null) => {
        const params: Record<string, string> = {};
        if (status) {
            params.status = status;
        }
        router.get('/admin/supplier-requests', params, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setSubmitting(true);
        router.delete(`/admin/supplier-requests/${deleteId}`, {
            onSuccess: () => {
                setDeleteId(null);
                setSubmitting(false);
            },
            onError: () => {
                setSubmitting(false);
            },
        });
    };

    const activeTab = filters.status || 'all';
    const filteredRequests = requests.data.filter((item) => {
        const query = search.trim().toLowerCase();

        return (
            query === '' ||
            [
                `PR-${String(item.id).padStart(6, '0')}`,
                item.category?.name ?? '',
                item.subcategory ?? '',
                item.user?.name ?? '',
                item.procurement_type,
                procurementMethodLabel(item.procurement_method),
                item.status.replace(/_/g, ' '),
            ].some((value) => value.toLowerCase().includes(query))
        );
    });

    return (
        <AdminLayout>
            <Head title="Supplier Requests" />

            <div className="mb-6 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                            <ClipboardList className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Procurement operations</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Supplier request review</h1>
                            <p className="mt-2 text-sm text-white/70">Review requirements, shortlist qualified suppliers, and follow approvals.</p>
                        </div>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85">
                        {requests.total} total requests
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <Card className="mb-5 rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        {tabs.map((tab) => {
                            const count = tab.key === null ? requests.total : requests.data.filter((r) => r.status === tab.key).length;
                            const isActive = activeTab === (tab.key || 'all');
                            return (
                                <button
                                    key={tab.key || 'all'}
                                    onClick={() => handleStatusFilter(tab.key)}
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
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Request queue</h2>
                            <p className="mt-0.5 text-xs text-gray-500">Search within the requests on this page.</p>
                        </div>
                        <label className="relative block sm:w-72">
                            <span className="sr-only">Search requests on this page</span>
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Request, category, or requester"
                                className="focus:border-teal focus:ring-teal/15 h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-2"
                            />
                        </label>
                    </div>
                    <div className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">#</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Request ID</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Type</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Category</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Procurement Method</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Requested By</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Status</th>
                                    <th className="px-6 py-4 pr-4 font-semibold text-white">Submitted</th>
                                    <th className="px-6 py-4 text-right font-semibold text-white">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50">
                                        <td className="px-6 py-4 pr-4 text-sm text-gray-500">{requests.from + index}</td>
                                        <td className="px-6 py-4 pr-4">
                                            <span className="text-sm font-medium text-gray-900">PR-{String(item.id).padStart(6, '0')}</span>
                                        </td>
                                        <td className="px-6 py-4 pr-4 text-gray-600">{item.procurement_type === 'supply' ? 'Supply' : 'Service'}</td>
                                        <td className="px-6 py-4 pr-4 text-gray-600">
                                            {item.category?.name || '-'}
                                            {item.subcategory && <span className="block text-xs text-gray-400">{item.subcategory}</span>}
                                        </td>
                                        <td className="px-6 py-4 pr-4 text-gray-600">{procurementMethodLabel(item.procurement_method)}</td>
                                        <td className="px-6 py-4 pr-4 text-gray-600">{item.user?.name || '-'}</td>
                                        <td className="px-6 py-4 pr-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 pr-4 text-gray-600">
                                            {item.created_at
                                                ? new Date(item.created_at).toLocaleDateString('en-GB', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/supplier-requests/${item.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-[#00515F] hover:text-[#00353D]">
                                                        Review
                                                        <span className="ml-1">→</span>
                                                    </Button>
                                                </Link>
                                                <span className="inline-flex opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                                                    <Dialog open={deleteId === item.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                                                onClick={() => setDeleteId(item.id)}
                                                                title="Delete supplier request"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Delete Supplier Request</DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure you want to delete request{' '}
                                                                    <strong>PR-{String(item.id).padStart(6, '0')}</strong>? This action cannot be undone.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => setDeleteId(null)} disabled={submitting}>
                                                                    Cancel
                                                                </Button>
                                                                <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                                                                    {submitting ? 'Deleting...' : 'Delete'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <ClipboardList className="h-12 w-12 text-gray-300" />
                                                <p className="mt-4 text-base font-medium text-gray-900">
                                                    {requests.data.length === 0 ? 'No supplier requests found' : 'No matching requests'}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {requests.data.length === 0
                                                        ? 'New supplier requests will appear here.'
                                                        : 'Try another request number, category, or requester.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
