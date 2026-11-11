import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Eye,
    FileSearch,
    FileText,
    Info,
    Play,
    Scale,
    Target,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface MatchedSupplier {
    id: number;
    legal_name: string;
    trade_name: string;
    primary_business_category: string;
    sub_category: string | null;
    specialization: string | null;
    procurement_type: string;
    registered_capital: number | null;
    latest_annual_turnover: number | null;
    contracts_count: number;
    match_score: number;
    eligible: boolean;
    match_breakdown: {
        category: { score: number; max: number; details: string[] };
        sub_category: { score: number; max: number; details: string[] };
        compliance: { score: number; max: number; details: string[] };
        experience: { score: number; max: number; details: string[] };
        financial: { score: number; max: number; details: string[] };
        performance: { score: number; max: number; details: string[] };
    };
    match_details: string[];
    eligibility_reasons: string[];
    date_established: string | null;
    trade_license_renewed_date: string | null;
    tax_clearance_expiry: string | null;
    number_of_employees: number | null;
    annual_production_capacity: string | null;
    capacity_unit: string | null;
}

interface SupplierRequest {
    id: number;
    procurement_type: string;
    category_id: number | null;
    primary_business_category: string | null;
    subcategory: string | null;
    specialization: string | null;
    procurement_method: string | null;
    number_of_suppliers_required: number;
    purpose_notes: string;
    established_before: string | null;
    established_after: string | null;
    minimum_capital: number | null;
    prefer_successful_suppliers: boolean;
    require_valid_trade_license: boolean;
    require_tax_clearance: boolean;
    vat_exempt_procurement: boolean;
    require_excise_tax: boolean;
    require_audited_financial_statements: boolean;
    require_manufacturer_authorization: boolean;
    minimum_similar_contracts: number | null;
    look_back_years: number | null;
    minimum_contract_value: number | null;
    minimum_annual_turnover: number | null;
    production_capacity_multiple: number | null;
    ro_number: string | null;
    ro_document: string | null;
    tech_spec_document: string | null;
    require_business_registration: boolean;
    require_valid_trade_license: boolean;
    require_tin_certificate: boolean;
    require_tax_clearance: boolean;
    require_vat_registration_certificate: boolean;
    require_egp_registration_letter: boolean;
    status: string;
    created_at: string;
    submitted_at: string | null;
    user?: { name: string };
    category?: { name: string };
}

interface ApprovedSupplier {
    id: number;
    legal_name: string;
    trade_name: string | null;
    primary_business_category: string | null;
    sub_category: string | null;
    registered_capital: number | null;
    latest_annual_turnover: number | null;
    contracts_count: number;
    selection_reason: string | null;
    override_reason: string | null;
}

interface AdminSupplierRequestShowProps {
    request: SupplierRequest;
    matchedSuppliers: MatchedSupplier[];
    selectedSuppliers: number[];
    savedOverrideReasons: Record<number, string>;
    approvedSuppliers: ApprovedSupplier[];
    matchSummary: {
        total_evaluated: number;
        eligible_count: number;
        selected_count: number;
        approved_count: number;
        required_count: number;
    };
    success?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Draft' },
    submitted: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', label: 'Submitted' },
    under_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Under Review' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejected' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Cancelled' },
};

const procurementTypeLabel = (type: string) => {
    if (type === 'supply') return 'Supply';
    if (type === 'service') return 'Service';
    if (type === 'consulting') return 'Consulting';
    if (type === 'non-consulting') return 'Non-Consulting';
    return type;
};

const procurementMethodLabel = (method: string | null) => {
    if (method === 'rfq') return 'RFQ';
    if (method === 'itb') return 'ITB';
    if (method === 'rfp') return 'RFP';
    return method || '-';
};

const matchScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50';
    if (score >= 60) return 'text-blue-700 bg-blue-50';
    if (score >= 40) return 'text-amber-700 bg-amber-50';
    return 'text-gray-700 bg-gray-100';
};

const statusLabel = (eligible: boolean, score: number) => {
    if (!eligible) return { label: 'Not Eligible', className: 'text-red-700 bg-red-50' };
    if (score >= 80) return { label: 'Recommended', className: 'text-emerald-700 bg-emerald-50' };
    if (score >= 60) return { label: 'Eligible', className: 'text-blue-700 bg-blue-50' };
    return { label: 'Partial Match', className: 'text-amber-700 bg-amber-50' };
};

const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(value);
};

const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
};

const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
    iconBg = 'bg-teal/10',
    iconText = 'text-teal',
}: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    iconBg?: string;
    iconText?: string;
}) => (
    <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconText}`}>
            <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    </div>
);

const FieldRow = ({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={`flex min-w-0 flex-col gap-1.5 rounded-xl bg-slate-50/80 p-3.5 ${className}`}>
        <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</span>
        <div className="text-sm font-medium break-words text-gray-900">{value}</div>
    </div>
);

export default function AdminSupplierRequestShow({
    request,
    matchedSuppliers,
    selectedSuppliers,
    savedOverrideReasons,
    approvedSuppliers,
    matchSummary,
    success,
}: AdminSupplierRequestShowProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>(selectedSuppliers);
    const [overrideReasons, setOverrideReasons] = useState<Record<number, string>>(savedOverrideReasons);
    const [viewSupplier, setViewSupplier] = useState<MatchedSupplier | null>(null);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showOverrideFor, setShowOverrideFor] = useState<MatchedSupplier | null>(null);
    const [shortlistApproveOpen, setShortlistApproveOpen] = useState(false);
    const [requirementsOpen, setRequirementsOpen] = useState(false);
    const [complianceOpen, setComplianceOpen] = useState(false);
    const [criteriaGuideOpen, setCriteriaGuideOpen] = useState(false);
    const [ineligiblePage, setIneligiblePage] = useState(1);
    const currentRequestId = useRef(request.id);

    useEffect(() => {
        if (currentRequestId.current === request.id) return;

        currentRequestId.current = request.id;
        setSelectedIds(selectedSuppliers);
        setOverrideReasons(savedOverrideReasons);
    }, [request.id, savedOverrideReasons, selectedSuppliers]);

    const eligibleSuppliers = useMemo(() => matchedSuppliers.filter((s) => s.eligible), [matchedSuppliers]);
    const ineligibleSuppliers = useMemo(() => matchedSuppliers.filter((s) => !s.eligible), [matchedSuppliers]);

    const ineligiblePageSize = 10;
    const ineligibleTotalPages = Math.max(1, Math.ceil(ineligibleSuppliers.length / ineligiblePageSize));
    const safeIneligiblePage = Math.min(ineligiblePage, ineligibleTotalPages);
    const paginatedIneligibleSuppliers = useMemo(
        () => ineligibleSuppliers.slice((safeIneligiblePage - 1) * ineligiblePageSize, safeIneligiblePage * ineligiblePageSize),
        [ineligibleSuppliers, safeIneligiblePage],
    );

    const selectedCount = selectedIds.length;
    const requiredCount = request.number_of_suppliers_required;
    const isComplete = selectedCount >= requiredCount;

    const persistSelection = (supplierIds: number[], reasons: Record<number, string>) => {
        setSubmitting(true);
        router.post(
            `/admin/supplier-requests/${request.id}/select-suppliers`,
            { supplier_ids: supplierIds, override_reasons: reasons },
            {
                preserveScroll: true,
                onError: () => {
                    setSelectedIds(selectedSuppliers);
                    setOverrideReasons(reasons);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleSelectToggle = (supplierId: number, supplier: MatchedSupplier) => {
        if (submitting) return;

        if (selectedIds.includes(supplierId)) {
            const nextSelectedIds = selectedIds.filter((id) => id !== supplierId);
            const nextOverrideReasons = { ...overrideReasons };
            delete nextOverrideReasons[supplierId];
            setSelectedIds(nextSelectedIds);
            setOverrideReasons(nextOverrideReasons);
            persistSelection(nextSelectedIds, nextOverrideReasons);
        } else {
            if (selectedIds.length >= requiredCount) return;

            if (!supplier.eligible) {
                setShowOverrideFor(supplier);
            } else {
                const nextSelectedIds = [...selectedIds, supplierId];
                setSelectedIds(nextSelectedIds);
                persistSelection(nextSelectedIds, overrideReasons);
            }
        }
    };

    const handleOverrideConfirm = () => {
        if (showOverrideFor) {
            const reason = overrideReasons[showOverrideFor.id]?.trim();

            if (!reason || selectedIds.length >= requiredCount || submitting) return;

            const nextSelectedIds = [...selectedIds, showOverrideFor.id];
            const nextOverrideReasons = { ...overrideReasons, [showOverrideFor.id]: reason };
            setSelectedIds(nextSelectedIds);
            setOverrideReasons(nextOverrideReasons);
            persistSelection(nextSelectedIds, nextOverrideReasons);
        }
        setShowOverrideFor(null);
    };

    const handleApproveShortlist = () => {
        setSubmitting(true);
        router.post(
            `/admin/supplier-requests/${request.id}/approve-shortlist`,
            {},
            {
                onFinish: () => {
                    setSubmitting(false);
                    setShortlistApproveOpen(false);
                },
            },
        );
    };

    const handleRunMatching = () => {
        setSubmitting(true);
        router.post(
            `/admin/supplier-requests/${request.id}/run-matching`,
            {},
            {
                onFinish: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    const handleApprove = () => {
        setSubmitting(true);
        router.post(
            `/admin/supplier-requests/${request.id}/approve`,
            {},
            {
                onFinish: () => {
                    setSubmitting(false);
                    setApproveOpen(false);
                },
            },
        );
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        setSubmitting(true);
        router.post(
            `/admin/supplier-requests/${request.id}/reject`,
            { reason: rejectReason },
            {
                onFinish: () => {
                    setSubmitting(false);
                    setRejectOpen(false);
                    setRejectReason('');
                },
            },
        );
    };

    const getMatchPercentage = (score: number, max: number) => {
        if (max === 0) return 0;
        return Math.round((score / max) * 100);
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-amber-500';
        return 'bg-gray-400';
    };

    const renderMatchBreakdown = (breakdown: MatchedSupplier['match_breakdown']) => {
        const items = [
            { key: 'category', label: 'Procurement Type & Category' },
            { key: 'sub_category', label: 'Business Scope Match' },
            { key: 'compliance', label: 'Compliance' },
            { key: 'experience', label: 'Experience' },
            { key: 'financial', label: 'Financial Capacity' },
            { key: 'performance', label: 'Historical Performance' },
        ];

        return (
            <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                    const score = breakdown[item.key as keyof typeof breakdown];
                    const percentage = getMatchPercentage(score.score, score.max);
                    return (
                        <div key={item.key} className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-gray-800">{item.label}</span>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                                    {score.score}/{score.max} pts
                                </span>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                <div className={`h-2 rounded-full transition-all ${getBarColor(percentage)}`} style={{ width: `${percentage}%` }} />
                            </div>
                            {score.details.length > 0 && (
                                <ul className="mt-3 space-y-1.5">
                                    {score.details.map((detail, idx) => (
                                        <li key={idx} className="text-xs leading-relaxed text-gray-600">
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title={`Supplier Request PR-${String(request.id).padStart(6, '0')}`} />

            <div className="space-y-6 pb-8">
                <Link
                    href="/admin/supplier-requests"
                    className="hover:text-dark-teal inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Supplier requests
                </Link>

                <section className="overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                    <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <div className="flex min-w-0 items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                                <FileText className="h-6 w-6" />
                            </span>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Supplier request review</p>
                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">PR-{String(request.id).padStart(6, '0')}</h1>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[request.status]?.bg || 'bg-gray-100'} ${statusConfig[request.status]?.text || 'text-gray-700'}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[request.status]?.dot || 'bg-gray-400'}`} />
                                        {statusConfig[request.status]?.label || request.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-white/70">
                                    Submitted by {request.user?.name || 'Unknown'} · {request.submitted_at ? formatDate(request.submitted_at) : '-'}
                                </p>
                                <p className="mt-1 text-xs text-white/55">
                                    {request.primary_business_category || request.category?.name || 'Uncategorized'} ·{' '}
                                    {procurementTypeLabel(request.procurement_type)} · {request.number_of_suppliers_required} suppliers requested
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {request.status === 'approved' ? (
                                <div className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                                    Request approved
                                </div>
                            ) : ['submitted', 'under_review'].includes(request.status) ? (
                                <>
                                    <Button
                                        size="sm"
                                        className="h-11 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-5 font-semibold text-white shadow-lg ring-1 shadow-emerald-950/15 ring-white/20 transition-all hover:-translate-y-0.5 hover:from-emerald-400 hover:to-teal-400 hover:shadow-xl"
                                        onClick={() => setApproveOpen(true)}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve Request
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-11 rounded-xl border border-white/25 bg-white/10 px-5 font-semibold text-white shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-rose-200/60 hover:bg-rose-500/20 hover:text-white"
                                        onClick={() => setRejectOpen(true)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </section>

                {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-700">{success}</p>
                    </div>
                )}

                <div className="space-y-6">
                    {request.status === 'approved' && (
                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                            <SectionHeader
                                icon={CheckCircle2}
                                title="Approved Suppliers"
                                subtitle={`${approvedSuppliers.length} of ${requiredCount} suppliers approved for this request`}
                                iconBg="bg-emerald-50"
                                iconText="text-emerald-600"
                            />
                            {approvedSuppliers.length > 0 ? (
                                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full min-w-[920px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">No.</th>
                                                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Supplier</th>
                                                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Category</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">Capital</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">Experience</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">Turnover</th>
                                                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Selection rationale</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {approvedSuppliers.map((supplier, index) => (
                                                <tr key={supplier.id} className="transition-colors hover:bg-gray-50/70">
                                                    <td className="px-4 py-3.5 text-sm text-gray-500">{index + 1}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{supplier.legal_name}</p>
                                                            {supplier.trade_name && supplier.trade_name !== supplier.legal_name && (
                                                                <p className="text-xs text-gray-500">{supplier.trade_name}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-sm text-gray-900">{supplier.primary_business_category || '-'}</span>
                                                        {supplier.sub_category && <span className="block text-xs text-gray-500">{supplier.sub_category}</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-gray-600">
                                                        {formatCurrency(supplier.registered_capital)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm text-gray-600">{supplier.contracts_count}</td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-gray-600">
                                                        {formatCurrency(supplier.latest_annual_turnover)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-600">
                                                        {supplier.override_reason ? (
                                                            <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
                                                                Override: {supplier.override_reason}
                                                            </span>
                                                        ) : (
                                                            supplier.selection_reason || 'Eligible selection'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-gray-200 bg-slate-50 p-8 text-center">
                                    <Users className="mx-auto h-10 w-10 text-gray-300" />
                                    <p className="mt-3 text-base font-medium text-gray-900">No approved suppliers yet</p>
                                    <p className="mt-1 text-sm text-gray-500">This request was approved without an assigned supplier shortlist.</p>
                                </div>
                            )}
                        </section>
                    )}

                    <Collapsible
                        open={requirementsOpen}
                        onOpenChange={setRequirementsOpen}
                        className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
                            <SectionHeader
                                icon={ClipboardList}
                                title="Request Requirements"
                                subtitle="Procurement details, eligibility criteria, and compliance requirements"
                                iconBg="bg-teal/10"
                                iconText="text-teal"
                            />
                            <CollapsibleTrigger className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-gray-50">
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${requirementsOpen ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                            <div className="space-y-0 px-6 pb-6">
                                <div className="border-t border-gray-100 pt-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-teal/10 text-dark-teal flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                            <Info className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
<h4 className="text-sm font-bold text-gray-900">Procurement information</h4>
                                        <p className="text-xs text-gray-500">Core information submitted with this supplier request</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <FieldRow label="Procurement Type" value={procurementTypeLabel(request.procurement_type)} />
                                        <FieldRow
                                            label="Business Category"
                                            value={request.primary_business_category || request.category?.name || '-'}
                                        />
<FieldRow label="Sub-category" value={request.subcategory || '-'} />
                                            <FieldRow label="RO Number" value={request.ro_number || '-'} />
                                        <FieldRow label="Specialization" value={request.specialization || '-'} />
                                        <FieldRow label="Procurement Method" value={procurementMethodLabel(request.procurement_method)} />
                                        <FieldRow label="Status" value={statusConfig[request.status]?.label || request.status} />
                                        <FieldRow label="Submitted At" value={formatDate(request.submitted_at)} />
                                        {request.purpose_notes && (
                                            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                                                <FieldRow
                                                    label="Purpose / Notes"
                                                    value={<p className="text-sm leading-relaxed text-gray-700">{request.purpose_notes}</p>}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Uploaded Documents */}
                                <div className="border-t border-gray-100 pt-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-teal/10 text-dark-teal flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                            <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Uploaded Documents</h4>
                                            <p className="text-xs text-gray-500">Supporting documents submitted with this request</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <FieldRow
                                            label="RO Document"
                                            value={
                                                request.ro_document ? (
                                                    <a
                                                        href={route('supplier-requests.ro-document.view', request.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-teal hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" /> View RO Document
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No file uploaded</span>
                                                )
                                            }
                                        />
                                        <FieldRow
                                            label="Technical Specification"
                                            value={
                                                request.tech_spec_document ? (
                                                    <a
                                                        href={route('supplier-requests.tech-spec-document.view', request.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-teal hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" /> View Technical Specification
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No file uploaded</span>
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-teal/10 text-dark-teal flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                            <Target className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Eligibility requirements</h4>
                                            <p className="text-xs text-gray-500">Criteria used by the automatic matching engine</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <FieldRow label="Minimum Registered Capital" value={formatCurrency(request.minimum_capital)} />
                                        <FieldRow label="Minimum Similar Contracts" value={request.minimum_similar_contracts ?? '-'} />
                                        <FieldRow label="Minimum Value per Contract" value={formatCurrency(request.minimum_contract_value)} />
                                        <FieldRow label="Minimum Annual Turnover" value={formatCurrency(request.minimum_annual_turnover)} />
                                    </div>
                                </div>

                                <Collapsible open={complianceOpen} onOpenChange={setComplianceOpen} className="border-t border-gray-100 pt-2">
                                    <div className="flex items-center justify-between gap-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-blue/10 text-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                                <Scale className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">Compliance requirements</h4>
                                                <p className="text-xs text-gray-500">Document and compliance requirements for this request</p>
                                            </div>
                                        </div>
                                        <CollapsibleTrigger className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-gray-50">
                                            <ChevronDown
                                                className={`h-4 w-4 text-gray-500 transition-transform ${complianceOpen ? 'rotate-180' : ''}`}
                                            />
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent>
                                        <div className="space-y-2 pb-4 px-6">
                                            {[
                                                {
                                                    id: 'require_business_registration',
                                                    label: 'Business Registration',
                                                    required: request.require_business_registration,
                                                    description: 'Supplier must provide valid business registration certificate.',
                                                },
                                                {
                                                    id: 'require_valid_trade_license',
                                                    label: 'Business License',
                                                    required: request.require_valid_trade_license,
                                                    description: 'Supplier must have a valid business license.',
                                                },
                                                {
                                                    id: 'require_tin_certificate',
                                                    label: 'TIN Certificate',
                                                    required: request.require_tin_certificate,
                                                    description: 'Supplier must provide Tax Identification Number certificate.',
                                                },
                                                {
                                                    id: 'require_tax_clearance',
                                                    label: 'Tax Clearance Certificate',
                                                    required: request.require_tax_clearance,
                                                    description: 'Supplier must provide valid tax clearance.',
                                                },
                                                {
                                                    id: 'require_vat_registration_certificate',
                                                    label: 'VAT Registration Certificate',
                                                    required: request.require_vat_registration_certificate,
                                                    description: 'Supplier must provide VAT registration certificate.',
                                                },
                                                {
                                                    id: 'require_egp_registration_letter',
                                                    label: 'EGP Registration Letter',
                                                    required: request.require_egp_registration_letter,
                                                    description: 'Supplier must provide EGP registration letter.',
                                                },
                                            ].map((item) => {
                                                const isSupply = request.procurement_type === 'supply';
                                                const isDisabled = item.id === 'require_tax_clearance' && isSupply;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${item.required ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                                                    >
                                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-emerald-500 bg-emerald-500">
                                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Label htmlFor={item.id} className="text-sm font-medium text-gray-900 truncate">{item.label}</Label>
                                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                                            {isDisabled && (
                                                                <p className="text-xs text-amber-600">Not required for this procurement type</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader className="pb-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-teal/10 text-teal flex h-10 w-10 items-center justify-center rounded-xl">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-gray-900">Automatic Matching Results</CardTitle>
                                        <CardDescription>
                                            {matchSummary.total_evaluated > 0
                                                ? `${matchSummary.eligible_count} eligible suppliers found, ${matchSummary.required_count} requested`
                                                : 'Run the matching engine to evaluate registered suppliers.'}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCriteriaGuideOpen(true)}
                                        className="hover:bg-teal/5 h-10 rounded-xl border-gray-200 bg-white px-4 text-gray-700 shadow-sm hover:border-teal-200 hover:text-[#00515F]"
                                    >
                                        <Info className="mr-2 h-4 w-4" />
                                        Criteria guide
                                    </Button>
                                    {request.status === 'submitted' && (
                                        <Button
                                            size="sm"
                                            onClick={handleRunMatching}
                                            disabled={submitting}
                                            className="h-10 rounded-xl bg-[#00515F] px-4 text-white shadow-sm transition hover:bg-[#003F49] hover:shadow-md"
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            {submitting ? 'Running...' : matchSummary.total_evaluated > 0 ? 'Refresh Matching' : 'Run Matching'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {matchSummary.total_evaluated === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileSearch className="h-12 w-12 text-gray-300" />
                                    <p className="mt-4 text-base font-medium text-gray-900">No matching results yet</p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Click "Run Matching" to evaluate registered suppliers against this request.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {eligibleSuppliers.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-gray-900">Eligible suppliers</h3>
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                    {eligibleSuppliers.length} matched
                                                </span>
                                            </div>
                                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full min-w-[1100px] text-left text-sm">
                                                        <thead className="bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                                            <tr className="border-b border-white/10">
                                                                <th className="w-10 px-4 py-3 pr-2 font-semibold text-white">Select</th>
                                                                <th className="w-14 px-3 py-3 text-center font-semibold text-white">#</th>
                                                                <th className="px-4 py-3 pr-4 font-semibold text-white">Supplier</th>
                                                                <th className="px-4 py-3 pr-4 font-semibold text-white">Category</th>
                                                                <th className="px-4 py-3 pr-4 text-right font-semibold text-white">Capital</th>
                                                                <th className="px-4 py-3 pr-4 text-center font-semibold text-white">Experience</th>
                                                                <th className="px-4 py-3 pr-4 text-right font-semibold text-white">Turnover</th>
                                                                <th className="px-4 py-3 pr-4 text-center font-semibold text-white">Compliance</th>
                                                                <th className="px-4 py-3 pr-4 text-center font-semibold text-white">Match</th>
                                                                <th className="px-4 py-3 pr-4 text-center font-semibold text-white">Status</th>
                                                                <th className="px-4 py-3 text-right font-semibold text-white">View</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {eligibleSuppliers.map((supplier, index) => {
                                                                const isSelected = selectedIds.includes(supplier.id);
                                                                const status = statusLabel(supplier.eligible, supplier.match_score);
                                                                return (
                                                                    <tr
                                                                        key={supplier.id}
                                                                        className={`group hover:bg-teal/5 border-b border-gray-100 transition-colors last:border-0 ${isSelected ? 'bg-teal/5' : 'even:bg-slate-50/40'}`}
                                                                    >
                                                                        <td className="px-4 py-3.5 pr-2">
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                disabled={
                                                                                    submitting ||
                                                                                    request.status === 'approved' ||
                                                                                    (!isSelected && selectedCount >= requiredCount)
                                                                                }
                                                                                onCheckedChange={() => handleSelectToggle(supplier.id, supplier)}
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-3.5 text-center">
                                                                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 tabular-nums">
                                                                                {index + 1}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                                                                                    {getInitials(supplier.legal_name)}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                                        {supplier.legal_name}
                                                                                    </p>
                                                                                    {supplier.trade_name &&
                                                                                        supplier.trade_name !== supplier.legal_name && (
                                                                                            <p className="text-xs text-gray-500">
                                                                                                {supplier.trade_name}
                                                                                            </p>
                                                                                        )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4">
                                                                            <div>
                                                                                <span className="text-sm text-gray-900">
                                                                                    {supplier.primary_business_category}
                                                                                </span>
                                                                                {supplier.sub_category && (
                                                                                    <span className="block text-xs text-gray-500">
                                                                                        {supplier.sub_category}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-right text-sm text-gray-600">
                                                                            {formatCurrency(supplier.registered_capital)}
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-center text-sm text-gray-600">
                                                                            {supplier.contracts_count}
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-right text-sm text-gray-600">
                                                                            {formatCurrency(supplier.latest_annual_turnover)}
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-center">
                                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                Compliant
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-center">
                                                                            <span
                                                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${matchScoreColor(supplier.match_score)}`}
                                                                            >
                                                                                {supplier.match_score}%
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4 text-center">
                                                                            <span
                                                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                                                                            >
                                                                                {status.label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 text-right">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setViewSupplier(supplier)}
                                                                                className="text-[#00515F] hover:text-[#00353D]"
                                                                            >
                                                                                <Eye className="mr-1 h-4 w-4" />
                                                                                View
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {ineligibleSuppliers.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-gray-900">Not eligible</h3>
                                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                    {ineligibleSuppliers.length} to review
                                                </span>
                                            </div>
                                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full min-w-[720px] text-left text-sm">
                                                        <thead className="bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                                            <tr className="border-b border-white/10">
                                                                <th className="w-10 px-4 py-3 pr-2 font-semibold text-white">Select</th>
                                                                <th className="w-14 px-3 py-3 text-center font-semibold text-white">#</th>
                                                                <th className="px-4 py-3 pr-4 font-semibold text-white">Supplier</th>
                                                                <th className="px-4 py-3 pr-4 font-semibold text-white">Category</th>
                                                                <th className="px-4 py-3 pr-4 font-semibold text-white">Reason</th>
                                                                <th className="px-4 py-3 text-right font-semibold text-white">View</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {paginatedIneligibleSuppliers.map((supplier, index) => {
                                                                const isSelected = selectedIds.includes(supplier.id);
                                                                return (
                                                                    <tr
                                                                        key={supplier.id}
                                                                        className={`group hover:bg-teal/5 border-b border-gray-100 transition-colors last:border-0 ${isSelected ? 'bg-teal/5' : 'even:bg-slate-50/40'}`}
                                                                    >
                                                                        <td className="px-4 py-3.5 pr-2">
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                disabled={
                                                                                    submitting ||
                                                                                    request.status === 'approved' ||
                                                                                    (!isSelected && selectedCount >= requiredCount)
                                                                                }
                                                                                onCheckedChange={() => handleSelectToggle(supplier.id, supplier)}
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-3.5 text-center">
                                                                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 tabular-nums">
                                                                                {(safeIneligiblePage - 1) * ineligiblePageSize + index + 1}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                                                                                    {getInitials(supplier.legal_name)}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                                        {supplier.legal_name}
                                                                                    </p>
                                                                                    {supplier.trade_name &&
                                                                                        supplier.trade_name !== supplier.legal_name && (
                                                                                            <p className="text-xs text-gray-500">
                                                                                                {supplier.trade_name}
                                                                                            </p>
                                                                                        )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4">
                                                                            <span className="text-sm text-gray-900">
                                                                                {supplier.primary_business_category}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 pr-4">
                                                                            <div className="flex flex-col gap-1">
                                                                                {supplier.eligibility_reasons.slice(0, 2).map((reason, idx) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        className="flex items-start gap-1 text-xs text-red-600"
                                                                                    >
                                                                                        <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                                                        {reason}
                                                                                    </span>
                                                                                ))}
                                                                                {supplier.eligibility_reasons.length > 2 && (
                                                                                    <span className="text-xs text-gray-500">
                                                                                        +{supplier.eligibility_reasons.length - 2} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 text-right">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setViewSupplier(supplier)}
                                                                                className="text-[#00515F] hover:text-[#00353D]"
                                                                            >
                                                                                <Eye className="mr-1 h-4 w-4" />
                                                                                View
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            {ineligibleTotalPages > 1 && (
                                                <div className="mt-4 flex items-center justify-between">
                                                    <p className="text-xs text-gray-500">
                                                        Showing {(safeIneligiblePage - 1) * ineligiblePageSize + 1} to{' '}
                                                        {Math.min(safeIneligiblePage * ineligiblePageSize, ineligibleSuppliers.length)} of{' '}
                                                        {ineligibleSuppliers.length} suppliers
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setIneligiblePage((p) => Math.max(1, p - 1))}
                                                            disabled={safeIneligiblePage === 1}
                                                            className="h-8 px-2 text-xs"
                                                        >
                                                            Previous
                                                        </Button>
                                                        {Array.from({ length: ineligibleTotalPages }, (_, i) => i + 1).map((page) => (
                                                            <Button
                                                                key={page}
                                                                variant={safeIneligiblePage === page ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => setIneligiblePage(page)}
                                                                className="h-8 min-w-[2rem] px-2 text-xs"
                                                            >
                                                                {page}
                                                            </Button>
                                                        ))}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setIneligiblePage((p) => Math.min(ineligibleTotalPages, p + 1))}
                                                            disabled={safeIneligiblePage === ineligibleTotalPages}
                                                            className="h-8 px-2 text-xs"
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {matchSummary.eligible_count < requiredCount && matchSummary.eligible_count > 0 && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-800">
                                                        Only {matchSummary.eligible_count} suppliers currently satisfy the mandatory requirements.
                                                    </p>
                                                    <p className="mt-1 text-xs text-amber-600">
                                                        Additional suppliers or relaxed criteria may be required to reach the requested quantity of{' '}
                                                        {requiredCount}.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {matchSummary.eligible_count === 0 && matchSummary.total_evaluated > 0 && (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-800">No eligible suppliers found</p>
                                                    <p className="mt-1 text-xs text-red-600">
                                                        No currently registered suppliers satisfy all mandatory requirements. Review the procurement
                                                        criteria or supplier registration data.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={!!viewSupplier} onOpenChange={(open) => !open && setViewSupplier(null)}>
                    <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0 [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:bg-white/10 [&>button]:hover:opacity-100">
                        {viewSupplier && (
                            <div className="flex max-h-[92vh] flex-col">
                                <div className="bg-linear-to-br from-[#00515F] via-[#00353D] to-[#001F24] px-6 py-6 text-white sm:px-8">
                                    <DialogHeader className="space-y-0 pr-8 text-left">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-bold text-white">
                                                    {getInitials(viewSupplier.legal_name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <DialogTitle className="truncate text-xl font-bold text-white sm:text-2xl">
                                                        {viewSupplier.legal_name}
                                                    </DialogTitle>
                                                    <DialogDescription className="mt-1 text-white/70">
                                                        {viewSupplier.trade_name && viewSupplier.trade_name !== viewSupplier.legal_name
                                                            ? `${viewSupplier.trade_name} · `
                                                            : ''}
                                                        {viewSupplier.primary_business_category || 'Business details'}
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-right">
                                                    <p className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">Match score</p>
                                                    <p className="text-2xl font-bold tabular-nums">{viewSupplier.match_score}%</p>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                        viewSupplier.eligible ? 'bg-emerald-400/15 text-emerald-100' : 'bg-rose-400/15 text-rose-100'
                                                    }`}
                                                >
                                                    {viewSupplier.eligible ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                    )}
                                                    {viewSupplier.eligible ? 'Eligible' : 'Not eligible'}
                                                </span>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                </div>

                                <div className="space-y-5 overflow-y-auto bg-slate-50/70 p-5 sm:p-8">
                                    <div
                                        className={`flex items-start gap-3 rounded-xl border p-4 ${viewSupplier.eligible ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                                    >
                                        {viewSupplier.eligible ? (
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                        ) : (
                                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        )}
                                        <div>
                                            <p className={`text-sm font-semibold ${viewSupplier.eligible ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {viewSupplier.eligible ? 'Meets the mandatory requirements' : 'Review the unmet requirements below'}
                                            </p>
                                            <p
                                                className={`mt-1 text-xs leading-relaxed ${viewSupplier.eligible ? 'text-emerald-700' : 'text-amber-700'}`}
                                            >
                                                {viewSupplier.eligible
                                                    ? 'This supplier passed the submitted eligibility checks. The score summarizes its fit across the request criteria.'
                                                    : 'This supplier remains available for review, but it did not pass every mandatory eligibility check.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 lg:grid-cols-2">
                                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-900">Business profile</h3>
                                            <p className="mt-1 text-xs text-gray-500">Supplier details compared with the request scope.</p>
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <FieldRow label="Business Category" value={viewSupplier.primary_business_category || '-'} />
                                                <FieldRow label="Sub-category" value={viewSupplier.sub_category || '-'} />
                                                <FieldRow label="Specialization" value={viewSupplier.specialization || '-'} />
                                                <FieldRow label="Procurement Type" value={procurementTypeLabel(viewSupplier.procurement_type)} />
                                                <FieldRow label="Established" value={formatDate(viewSupplier.date_established)} />
                                                <FieldRow label="Employees" value={viewSupplier.number_of_employees ?? '-'} />
                                            </div>
                                        </section>

                                        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-900">Financial and capacity</h3>
                                            <p className="mt-1 text-xs text-gray-500">Reported supplier figures against the request thresholds.</p>
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <FieldRow label="Registered Capital" value={formatCurrency(viewSupplier.registered_capital)} />
                                                <FieldRow label="Annual Turnover" value={formatCurrency(viewSupplier.latest_annual_turnover)} />
                                                <FieldRow label="Contract Records" value={viewSupplier.contracts_count} />
                                                <FieldRow
                                                    label="Annual Production Capacity"
                                                    value={
                                                        viewSupplier.annual_production_capacity && viewSupplier.capacity_unit
                                                            ? `${viewSupplier.annual_production_capacity} ${viewSupplier.capacity_unit}`
                                                            : '-'
                                                    }
                                                />
                                            </div>
                                        </section>
                                    </div>

                                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-teal/10 text-teal flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                                                <ClipboardList className="h-4.5 w-4.5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Request being assessed</h3>
                                                <p className="mt-1 text-xs text-gray-500">Supplier matching uses these submitted requirements.</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <FieldRow label="Procurement Type" value={procurementTypeLabel(request.procurement_type)} />
                                            <FieldRow label="Procurement Method" value={procurementMethodLabel(request.procurement_method)} />
                                            <FieldRow
                                                label="Business Category"
                                                value={request.primary_business_category || request.category?.name || '-'}
                                            />
<FieldRow label="Sub-category" value={request.subcategory || '-'} />
                                        <FieldRow label="RO Number" value={request.ro_number || '-'} />
                                        <FieldRow label="Specialization" value={request.specialization || '-'} />
                                            <FieldRow label="Minimum Capital" value={formatCurrency(request.minimum_capital)} />
                                            <FieldRow label="Minimum Annual Turnover" value={formatCurrency(request.minimum_annual_turnover)} />
                                            <FieldRow label="Minimum Similar Contracts" value={request.minimum_similar_contracts ?? '-'} />
                                            <FieldRow label="Minimum Contract Value" value={formatCurrency(request.minimum_contract_value)} />
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div className="mb-5">
                                            <h3 className="text-sm font-bold text-gray-900">Assessment breakdown</h3>
                                            <p className="mt-1 text-xs text-gray-500">Detailed match scores and checks for this supplier.</p>
                                        </div>
                                        {renderMatchBreakdown(viewSupplier.match_breakdown)}
                                    </section>

                                    {viewSupplier.eligibility_reasons.length > 0 && (
                                        <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                                            <h3 className="text-sm font-bold text-rose-800">Requirements not met</h3>
                                            <div className="mt-3 space-y-2">
                                                {viewSupplier.eligibility_reasons.map((reason, idx) => (
                                                    <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3">
                                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                                        <p className="text-sm leading-relaxed text-rose-700">{reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                <Dialog open={criteriaGuideOpen} onOpenChange={setCriteriaGuideOpen}>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0 [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:bg-white/10 [&>button]:hover:opacity-100">
                        <div className="flex max-h-[90vh] flex-col">
                            <DialogHeader className="bg-linear-to-br from-[#00515F] via-[#00353D] to-[#001F24] px-6 py-6 pr-14 text-left text-white sm:px-8">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8de1e9]">
                                        <Info className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-white">How automatic matching works</DialogTitle>
                                        <DialogDescription className="mt-1 text-white/70">
                                            Eligibility checks and weighted scores for PR-{String(request.id).padStart(6, '0')}.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 overflow-y-auto bg-slate-50/70 p-5 sm:p-8">
                                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900">Request criteria used for this match</h3>
                                    <p className="mt-1 text-xs text-gray-500">Only approved supplier accounts are evaluated.</p>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <FieldRow label="Procurement Type" value={procurementTypeLabel(request.procurement_type)} />
                                        <FieldRow
                                            label="Business Category"
                                            value={request.primary_business_category || request.category?.name || '-'}
                                        />
                                        <FieldRow label="Sub-category" value={request.subcategory || '-'} />
                                        <FieldRow label="Specialization" value={request.specialization || '-'} />
                                        <FieldRow label="Procurement Method" value={procurementMethodLabel(request.procurement_method)} />
                                        <FieldRow label="Minimum Capital" value={formatCurrency(request.minimum_capital)} />
                                        <FieldRow label="Minimum Annual Turnover" value={formatCurrency(request.minimum_annual_turnover)} />
                                        <FieldRow label="Minimum Similar Contracts" value={request.minimum_similar_contracts ?? '-'} />
                                        <FieldRow label="Minimum Contract Value" value={formatCurrency(request.minimum_contract_value)} />
                                    </div>
                                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-gray-600">
                                        Business registration, business license, TIN, VAT registration, and EGP registration documents are required
                                        for every request. Tax clearance documents and a current tax clearance date are also required for supply
                                        requests.
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900">Eligibility checks</h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        A supplier must pass each applicable hard check to be marked eligible.
                                    </p>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        {[
                                            [
                                                'Procurement type and category',
                                                'The supplier must support the requested type and match the primary business category.',
                                            ],
                                            ['Sub-category and specialization', 'Each submitted scope value must match the supplier registration.'],
                                            [
                                                'Required documents',
                                                'Required documents must be on file and not rejected; business license and supply tax clearance must also be current.',
                                            ],
                                            [
                                                'Financial thresholds',
                                                'When entered, minimum capital and annual turnover are checked against supplier records.',
                                            ],
                                            [
                                                'Similar contracts',
                                                'When a minimum count is entered, contracts are filtered by any submitted value and look-back limits.',
                                            ],
                                            [
                                                'Supplier quantity',
                                                'The requested quantity sets the shortlist target; it does not change an individual supplier’s eligibility.',
                                            ],
                                        ].map(([title, description]) => (
                                            <div key={title} className="rounded-xl border border-gray-100 bg-slate-50/70 p-4">
                                                <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
                                                <p className="mt-1 text-xs leading-relaxed text-gray-600">{description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Match score weights</h3>
                                            <p className="mt-1 text-xs text-gray-500">The score helps rank suppliers who pass eligibility checks.</p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500">Total weight: 100 points</span>
                                    </div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                            ['Procurement type & category', 25],
                                            ['Business scope', 20],
                                            ['Compliance', 20],
                                            ['Experience', 15],
                                            ['Financial capacity', 10],
                                            ['Historical performance', 10],
                                        ].map(([label, weight]) => (
                                            <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#00515F] shadow-sm">
                                                    {weight}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-gray-500">
                                        Historical performance is not collected on this request form, so it currently receives neutral full credit.
                                        Procurement method is shown for context and is not a supplier matching criterion.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={showOverrideFor !== null} onOpenChange={(open) => !open && setShowOverrideFor(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Override Selection</DialogTitle>
                            <DialogDescription>
                                This supplier does not meet one or more mandatory requirements. Please provide a reason for the override.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="override-reason">Override Reason</Label>
                                <Textarea
                                    id="override-reason"
                                    value={showOverrideFor ? overrideReasons[showOverrideFor.id] || '' : ''}
                                    onChange={(e) => setOverrideReasons((prev) => ({ ...prev, [showOverrideFor!.id]: e.target.value }))}
                                    placeholder="Provide a justification for selecting this non-eligible supplier..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOverrideFor(null)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleOverrideConfirm}
                                disabled={submitting || !(showOverrideFor ? overrideReasons[showOverrideFor.id]?.trim() : false)}
                                className="bg-amber-600 text-white hover:bg-amber-700"
                            >
                                Confirm Override
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Supplier Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this supplier request? This will notify the procurement team.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleApprove} disabled={submitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                                {submitting ? 'Approving...' : 'Approve'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Supplier Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reject this supplier request? You can provide an optional reason below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reject-reason">Reason</Label>
                                <Textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Optional reason for rejection..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleReject} disabled={submitting || !rejectReason.trim()} variant="destructive">
                                {submitting ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={shortlistApproveOpen} onOpenChange={setShortlistApproveOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Supplier Shortlist?</DialogTitle>
                            <DialogDescription>
                                You are about to approve {selectedCount} suppliers for this procurement request. This action will record the selected
                                suppliers against the request.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShortlistApproveOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApproveShortlist}
                                disabled={submitting || !isComplete}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {submitting ? 'Approving...' : 'Approve Shortlist'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
