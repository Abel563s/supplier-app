import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Label } from '@/components/ui/label';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, FileText, Info, Layers3, Scale, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface ApprovedSupplier {
    id: number;
    legal_name: string;
    trade_name: string;
    primary_business_category: string;
    sub_category: string | null;
    procurement_type: string;
    registered_capital: number | null;
    latest_annual_turnover: number | null;
    contracts_count: number;
    selected_at: string | null;
    approved_at: string | null;
    selection_reason: string | null;
}

interface ProcurementRequest {
    id: number;
    procurement_type: string;
    procurement_method: string;
    primary_business_category: string;
    subcategory: string | null;
    specialization: string | null;
    number_of_suppliers_required: number;
    purpose_notes: string | null;
    minimum_capital: number | null;
    require_business_registration: boolean;
    require_valid_trade_license: boolean;
    require_tin_certificate: boolean;
    require_tax_clearance: boolean;
    require_vat_registration_certificate: boolean;
    require_egp_registration_letter: boolean;
    minimum_similar_contracts: number | null;
    minimum_contract_value: number | null;
    minimum_annual_turnover: number | null;
    ro_number: string | null;
    ro_document_url: string | null;
    tech_spec_document_url: string | null;
    status: string;
    created_at: string;
    submitted_at: string | null;
    user?: { name: string };
}

interface ProcurementRequestShowProps {
    request: ProcurementRequest;
    approvedSuppliers: ApprovedSupplier[] | null;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Draft' },
    submitted: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', label: 'Submitted' },
    under_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Under Review' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approved' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejected' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Cancelled' },
};

const procurementTypeLabel = (type: string) => (type === 'supply' ? 'Supply' : type === 'service' ? 'Service' : type);

const procurementMethodLabel = (method: string) => {
    if (method === 'rfq') return 'RFQ';
    if (method === 'itb') return 'ITB';
    if (method === 'rfp') return 'RFP';
    return method;
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

const Pill = ({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'success' | 'neutral' | 'muted' }) => {
    const styles = {
        success: 'bg-emerald-50 text-emerald-700',
        neutral: 'bg-gray-100 text-gray-700',
        muted: 'bg-gray-50 text-gray-500',
    };
    return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}>{children}</span>;
};

export default function ProcurementRequestShow({ request, approvedSuppliers }: ProcurementRequestShowProps) {
    const isApproved = request.status === 'approved';
    const status = statusConfig[request.status] || statusConfig.draft;
    const requestNumber = `PR-${String(request.id).padStart(6, '0')}`;

    const [requirementsOpen, setRequirementsOpen] = useState(false);
    const [complianceOpen, setComplianceOpen] = useState(false);

    const requiredCount = request.number_of_suppliers_required;
    const approvedCount = approvedSuppliers?.length ?? 0;

    return (
        <AdminLayout>
            <Head title={`Supplier Request ${requestNumber}`} />

            <div className="space-y-6 pb-8">
                <Link
                    href="/proc/request-supplier"
                    className="hover:text-dark-teal inline-flex w-fit items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Supplier requests
                </Link>

                <section className="overflow-hidden rounded-2xl bg-[#00515F] text-white shadow-sm">
                    <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">Request overview</p>
                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{requestNumber}</h1>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                        {status.label}
                                    </span>
                                </div>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                                    {request.primary_business_category}
                                    {request.subcategory ? ` · ${request.subcategory}` : ''} supplier request for{' '}
                                    {procurementTypeLabel(request.procurement_type).toLowerCase()}.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:min-w-52">
                            <p className="text-xs font-medium tracking-wider text-white/50 uppercase">Submitted by</p>
                            <p className="mt-1 text-sm font-semibold">{request.user?.name || 'Unknown'}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatDate(request.submitted_at)}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <Layers3 className="h-4 w-4 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Procurement type</p>
                                <p className="mt-0.5 text-sm font-semibold">{procurementTypeLabel(request.procurement_type)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <ClipboardList className="h-4 w-4 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Business category</p>
                                <p className="mt-0.5 text-sm font-semibold">{request.primary_business_category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <Users className="h-4 w-4 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Suppliers requested</p>
                                <p className="mt-0.5 text-sm font-semibold">{request.number_of_suppliers_required}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Request Requirements */}
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
                        {/* Procurement Information */}
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
                                    <FieldRow label="Business Category" value={request.primary_business_category} />
                                    <FieldRow label="Sub-category" value={request.subcategory || '-'} />
                                    <FieldRow label="RO Number" value={request.ro_number || '-'} />
                                    <FieldRow label="Specialization" value={request.specialization || '-'} />
                                    <FieldRow label="Procurement Method" value={procurementMethodLabel(request.procurement_method)} />
                                    <FieldRow
                                        label="Status"
                                        value={
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        }
                                    />
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
                                            request.ro_document_url ? (
                                                <a
                                                    href={request.ro_document_url}
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
                                            request.tech_spec_document_url ? (
                                                <a
                                                    href={request.tech_spec_document_url}
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

                            {/* Supplier Eligibility */}
                            <div className="border-t border-gray-100 pt-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-teal/10 text-dark-teal flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                        <ClipboardList className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">Supplier eligibility</h4>
                                        <p className="text-xs text-gray-500">Eligibility criteria applied to matching suppliers</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <FieldRow
                                        label="Minimum Registered Capital"
                                        value={<span className="text-sm font-semibold text-gray-900">{formatCurrency(request.minimum_capital)}</span>}
                                    />
                                    <FieldRow label="Minimum Similar Contracts" value={request.minimum_similar_contracts ?? '-'} />
                                    <FieldRow
                                        label="Minimum Value per Contract"
                                        value={
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(request.minimum_contract_value)}
                                            </span>
                                        }
                                    />
                                    <FieldRow
                                        label="Minimum Annual Turnover"
                                        value={
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(request.minimum_annual_turnover)}
                                            </span>
                                        }
                                    />
                                </div>
                            </div>

                            {/* Compliance Requirements - Collapsible */}
                            <Collapsible
                                open={complianceOpen}
                                onOpenChange={setComplianceOpen}
                                className="border-t border-gray-100"
                            >
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-blue/10 text-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                            <Scale className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Compliance requirements</h4>
                                            <p className="text-xs text-gray-500">Mandatory documents and compliance requirements for this request</p>
                                        </div>
                                    </div>
                                    <CollapsibleTrigger className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-gray-50">
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${complianceOpen ? 'rotate-180' : ''}`} />
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

                {/* Approved Suppliers */}
                {isApproved && approvedSuppliers && approvedSuppliers.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <SectionHeader
                                icon={CheckCircle2}
                                title="Approved Suppliers"
                                subtitle={`${approvedCount} of ${requiredCount} suppliers approved for this request`}
                                iconBg="bg-emerald-50"
                                iconText="text-emerald-600"
                            />
                            <Link
                                href={`/proc/requests/${request.id}/letter`}
                                className="text-teal hover:bg-teal/10 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                View Letter
                            </Link>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/60">
                                        <th className="px-4 py-3 pr-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">No.</th>
                                        <th className="px-4 py-3 pr-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Supplier</th>
                                        <th className="px-4 py-3 pr-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Category</th>
                                        <th className="px-4 py-3 pr-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Capital
                                        </th>
                                        <th className="px-4 py-3 pr-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Experience
                                        </th>
                                        <th className="px-4 py-3 pr-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                            Turnover
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {approvedSuppliers.map((supplier, index) => (
                                        <tr key={supplier.id} className="group transition-colors hover:bg-gray-50/70">
                                            <td className="px-4 py-3.5 pr-4 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-teal/10 text-dark-teal flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold">
                                                        {getInitials(supplier.legal_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{supplier.legal_name}</p>
                                                        {supplier.trade_name && supplier.trade_name !== supplier.legal_name && (
                                                            <p className="text-xs text-gray-500">{supplier.trade_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 pr-4">
                                                <div>
                                                    <span className="text-sm text-gray-900">{supplier.primary_business_category}</span>
                                                    {supplier.sub_category && (
                                                        <span className="block text-xs text-gray-500">{supplier.sub_category}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 pr-4 text-right text-sm text-gray-600">
                                                {formatCurrency(supplier.registered_capital)}
                                            </td>
                                            <td className="px-4 py-3.5 pr-4 text-center text-sm text-gray-600">{supplier.contracts_count}</td>
                                            <td className="px-4 py-3.5 pr-4 text-right text-sm text-gray-600">
                                                {formatCurrency(supplier.latest_annual_turnover)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {isApproved && (!approvedSuppliers || approvedSuppliers.length === 0) && (
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-sm">
                        <Users className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-4 text-base font-medium text-gray-900">No approved suppliers yet</p>
                        <p className="mt-1 text-sm text-gray-500">This request has been approved but no suppliers have been assigned.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
