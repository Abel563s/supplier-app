import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import { primaryBusinessCategoryOptions, procurementTypeOptions, specializationOptions, subCategoryOptions } from '@/lib/registration-options';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    CircleCheckBig,
    ClipboardList,
    Clock3,
    FileSearch,
    Gauge,
    Inbox,
    Plus,
    Scale,
    Search,
    ShieldCheck,
    Sparkles,
    Upload,
    Users,
    ExternalLink,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState, useEffect } from 'react';

interface RequestItem {
    id: number;
    primary_business_category: string;
    subcategory: string | null;
    procurement_type: string;
    procurement_method: string;
    ro_number: string | null;
    specialization: string | null;
    number_of_suppliers_required: number;
    status: string;
    submitted_at: string | null;
    created_at: string | null;
}

interface RequestSupplierProps {
    requests: RequestItem[];
    title: string;
    success?: boolean;
}

const procurementTypeLabel = (type: string) => {
    if (type === 'supply') return 'Supply';
    if (type === 'service') return 'Subcontract works & Services';
    if (type === 'consulting') return 'Consulting';
    if (type === 'non-consulting') return 'Non-Consulting';
    return type;
};

const procurementMethodLabel = (method: string) => {
    if (method === 'rfq') return 'RFQ';
    if (method === 'itb') return 'ITB';
    if (method === 'rfp') return 'RFP';
    return method;
};

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-50 text-blue-700',
    under_review: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
};

const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function RequestSupplier({ requests, title, success }: RequestSupplierProps) {
    const [showForm, setShowForm] = useState(false);
    const [submittedId, setSubmittedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showLegalRequirements, setShowLegalRequirements] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [roFileName, setRoFileName] = useState<string>('');
    const [techSpecFileName, setTechSpecFileName] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        primary_business_category: '',
        subcategory: '',
        procurement_type: 'supply',
        purpose_notes: '',
        minimum_capital: '',
        require_valid_trade_license: true,
        require_tax_clearance: true,
        require_business_registration: true,
        require_tin_certificate: true,
        require_vat_registration_certificate: true,
        require_egp_registration_letter: true,
        minimum_similar_contracts: '',
        minimum_contract_value: '',
        minimum_annual_turnover: '',
        specialization: '',
        procurement_method: 'rfq',
        ro_number: '',
        ro_document: null as File | null,
        tech_spec_document: null as File | null,
    });

    const selectedCategory = data.primary_business_category;

    const activeCriteriaCount = useMemo(() => {
        let count = 0;
        if (data.minimum_capital) count++;
        if (data.minimum_similar_contracts) count++;
        if (data.minimum_contract_value) count++;
        if (data.minimum_annual_turnover) count++;
        return count;
    }, [data]);

    const activeComplianceCount = useMemo(() => {
        let count = 0;
        if (data.require_business_registration) count++;
        if (data.require_business_license) count++;
        if (data.require_tin_certificate) count++;
        if (data.require_tax_clearance_certificate) count++;
        if (data.require_vat_registration_certificate) count++;
        if (data.require_egp_registration_letter) count++;
        return count;
    }, [data]);

    const activeExperienceCount = useMemo(() => {
        let count = 0;
        if (data.minimum_similar_contracts) count++;
        if (data.minimum_contract_value) count++;
        if (data.minimum_annual_turnover) count++;
        return count;
    }, [data]);

    const completionPercentage = useMemo(() => {
        const required = ['primary_business_category', 'procurement_type', 'subcategory', 'procurement_method', 'specialization', 'ro_number'];
        const filled = required.filter(
            (field) =>
                data[field as keyof typeof data] !== '' &&
                data[field as keyof typeof data] !== null &&
                data[field as keyof typeof data] !== undefined,
        );
        return Math.round((filled.length / required.length) * 100);
    }, [data]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/proc/request-supplier', {
            onSuccess: () => {
                reset();
                setSubmittedId(Date.now());
                setShowForm(false);
            },
        });
    };

    const stats = useMemo(() => {
        const total = requests.length;
        const submitted = requests.filter((r) => r.status === 'submitted').length;
        const underReview = requests.filter((r) => r.status === 'under_review').length;
        const approved = requests.filter((r) => r.status === 'approved').length;
        return { total, submitted, underReview, approved };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        const filtered = requests.filter((request) => {
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            const matchesQuery =
                normalizedQuery === '' ||
                [
                    `PR-${String(request.id).padStart(6, '0')}`,
                    request.primary_business_category,
                    request.subcategory ?? '',
                    request.procurement_type,
                    request.status.replace(/_/g, ' '),
                ].some((value) => value.toLowerCase().includes(normalizedQuery));

            return matchesStatus && matchesQuery;
        });

        // Pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [requests, searchQuery, statusFilter, currentPage]);

    const totalPages = Math.ceil(
        requests.filter((request) => {
            const normalizedQuery = searchQuery.trim().toLowerCase();
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            const matchesQuery =
                normalizedQuery === '' ||
                [
                    `PR-${String(request.id).padStart(6, '0')}`,
                    request.primary_business_category,
                    request.subcategory ?? '',
                    request.procurement_type,
                    request.status.replace(/_/g, ' '),
                ].some((value) => value.toLowerCase().includes(normalizedQuery));
            return matchesStatus && matchesQuery;
        }).length / itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Success state after form submission
    if (submittedId && !showForm) {
        return (
            <AdminLayout>
                <Head title="Supplier Request Submitted" />
                <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                            <CircleCheckBig className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h1 className="mt-6 text-3xl font-bold text-gray-900">Supplier Request Submitted</h1>
                        <p className="mt-3 max-w-md text-base text-gray-600">
                            Your supplier requirement request has been successfully created and submitted for review.
                        </p>
                        <div className="mt-8 w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Status</span>
                                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                    Pending Review
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                            <Button onClick={() => setSubmittedId(null)} className="bg-[#00515F] text-white hover:bg-[#00515F]/90">
                                View My Requests
                            </Button>
                            <Button variant="outline" onClick={() => setSubmittedId(null)}>
                                Back to Requests
                            </Button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Form view
    if (showForm) {
        return (
            <AdminLayout>
                <Head title="New Supplier Request" />

                <div className="mb-8">
                    <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                        <button onClick={() => setShowForm(false)} className="hover:text-teal transition-colors">
                            Supplier Requests
                        </button>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-gray-900">New Request</span>
                    </nav>
                    <div className="overflow-hidden rounded-2xl bg-[#00515F] text-white shadow-sm">
                        <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">Procurement workspace</p>
                                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Create a supplier request</h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                                        Define what your project needs and let the procurement team identify qualified suppliers.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                className="w-fit gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Requests
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">1</span>
                                <span className="text-sm font-medium text-white/80">Request details</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">2</span>
                                <span className="text-sm font-medium text-white/80">Eligibility & compliance</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">3</span>
                                <span className="text-sm font-medium text-white/80">Review & submit</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
                                <CardHeader className="pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal/10 text-teal flex h-10 w-10 items-center justify-center rounded-xl">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Request Details</CardTitle>
                                            <CardDescription>Define the type of suppliers required for this procurement request.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="procurement_type" className="form-required text-sm font-medium text-gray-700">
                                                Procurement Type
                                            </Label>
                                            <Select value={data.procurement_type} onValueChange={(value) => setData('procurement_type', value)}>
                                                <SelectTrigger id="procurement_type" className="h-11">
                                                    <SelectValue placeholder="Select procurement type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {procurementTypeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.procurement_type && <p className="text-sm text-red-600">{errors.procurement_type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="primary_business_category" className="form-required text-sm font-medium text-gray-700">
                                                Primary Business Category
                                            </Label>
                                            <Select
                                                value={data.primary_business_category}
                                                onValueChange={(value) => setData('primary_business_category', value)}
                                            >
                                                <SelectTrigger id="primary_business_category" className="h-11">
                                                    <SelectValue placeholder="Select primary business category" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-80">
                                                    {primaryBusinessCategoryOptions.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.primary_business_category && (
                                                <p className="text-sm text-red-600">{errors.primary_business_category}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subcategory" className="form-required text-sm font-medium text-gray-700">
                                                Sub-category
                                            </Label>
                                            <SearchableSelect
                                                id="subcategory"
                                                value={data.subcategory}
                                                onChange={(value) => setData('subcategory', value)}
                                                options={subCategoryOptions}
                                                placeholder="Search or select sub-category"
                                                emptyMessage="No sub-category found."
                                            />
                                            {errors.subcategory && <p className="text-sm text-red-600">{errors.subcategory}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="specialization" className="form-required text-sm font-medium text-gray-700">
                                                Specialization
                                            </Label>
                                            <SearchableSelect
                                                id="specialization"
                                                value={data.specialization}
                                                onChange={(value) => setData('specialization', value)}
                                                options={specializationOptions}
                                                placeholder="Search or select specialization"
                                                emptyMessage="No specialization found."
                                            />
                                            {errors.specialization && <p className="text-sm text-red-600">{errors.specialization}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="procurement_method" className="form-required text-sm font-medium text-gray-700">
                                                    Procurement Method
                                                </Label>
                                                <Select
                                                    value={data.procurement_method}
                                                    onValueChange={(value) => setData('procurement_method', value)}
                                                >
                                                    <SelectTrigger id="procurement_method" className="h-11">
                                                        <SelectValue placeholder="Select procurement method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="rfq">RFQ</SelectItem>
                                                        <SelectItem value="itb">ITB</SelectItem>
                                                        <SelectItem value="rfp">RFP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.procurement_method && <p className="text-sm text-red-600">{errors.procurement_method}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ro_number" className="form-required text-sm font-medium text-gray-700">
                                                    RO Number
                                                </Label>
                                                <Input
                                                    id="ro_number"
                                                    value={data.ro_number}
                                                    onChange={(e) => setData('ro_number', e.target.value)}
                                                    className="h-11"
                                                    placeholder="RO Number"
                                                />
                                                {errors.ro_number && <p className="text-sm text-red-600">{errors.ro_number}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="ro_document" className="form-required text-sm font-medium text-gray-700">
                                                    RO Upload
                                                </Label>
                                                <div className="relative">
                                                    <input
                                                        id="ro_document"
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 w-full h-11 opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] ?? null;
                                                            setData('ro_document', file);
                                                            setRoFileName(file?.name ?? '');
                                                        }}
                                                        required
                                                    />
                                                    <div className="flex items-center justify-between h-11 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 transition-colors hover:border-teal hover:bg-teal/5">
                                                        <div className="flex items-center gap-3">
                                                            <Upload className="h-5 w-5 text-gray-400" />
                                                            {roFileName ? (
                                                                <>
                                                                    <span className="text-sm font-medium text-[#00515F]">{roFileName}</span>
                                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setRoFileName('');
                                                            setData('ro_document', null);
                                                        }}
                                                        className="ml-2 text-xs text-red-500 hover:text-red-700 underline"
                                                    >
                                                        Remove
                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-700">Upload RO Document (PDF)</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">PDF only</span>
                                                    </div>
                                                </div>
                                                {errors.ro_document && <p className="text-sm text-red-600">{errors.ro_document}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tech_spec_document" className="text-sm font-medium text-gray-700">
                                                    Technical Specification Upload
                                                </Label>
                                                <div className="relative">
                                                    <input
                                                        id="tech_spec_document"
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 w-full h-11 opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] ?? null;
                                                            setData('tech_spec_document', file);
                                                            setTechSpecFileName(file?.name ?? '');
                                                        }}
                                                    />
                                                    <div className="flex items-center justify-between h-11 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 transition-colors hover:border-teal hover:bg-teal/5">
                                                        <div className="flex items-center gap-3">
                                                            <Upload className="h-5 w-5 text-gray-400" />
                                                            {techSpecFileName ? (
                                                                <>
                                                                    <span className="text-sm font-medium text-[#00515F]">{techSpecFileName}</span>
                                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setTechSpecFileName('');
                                                            setData('tech_spec_document', null);
                                                        }}
                                                        className="ml-2 text-xs text-red-500 hover:text-red-700 underline"
                                                    >
                                                        Remove
                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-700">Upload Technical Specification (PDF)</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">PDF only</span>
                                                    </div>
                                                </div>
                                                {errors.tech_spec_document && <p className="text-sm text-red-600">{errors.tech_spec_document}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="purpose_notes" className="text-sm font-medium text-gray-700">
                                            Purpose / Notes
                                        </Label>
                                        <Textarea
                                            id="purpose_notes"
                                            value={data.purpose_notes}
                                            onChange={(e) => setData('purpose_notes', e.target.value)}
                                            className="min-h-[120px] resize-y"
                                            placeholder="Describe why these suppliers are needed and any relevant procurement context..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
                                <CardHeader className="pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal/10 text-teal flex h-10 w-10 items-center justify-center rounded-xl">
                                            <FileSearch className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Selection Criteria</CardTitle>
                                            <CardDescription>
                                                Define optional criteria that help procurement prioritize suitable suppliers.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs text-gray-600">
                                            Selection criteria are used to narrow or prioritize supplier candidates. Information such as registered
                                            capital is collected during supplier registration and may be verified by the Admin.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="minimum_capital" className="text-sm font-medium text-gray-700">
                                                Minimum Registered Capital (ETB)
                                            </Label>
                                            <Input
                                                id="minimum_capital"
                                                type="number"
                                                min={0}
                                                value={data.minimum_capital}
                                                onChange={(e) => setData('minimum_capital', e.target.value ? parseInt(e.target.value, 10) : '')}
                                                className="h-11"
                                                placeholder="e.g. 10,000,000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimum_similar_contracts" className="text-sm font-medium text-gray-700">
                                                Minimum Similar Contracts
                                            </Label>
                                            <Input
                                                id="minimum_similar_contracts"
                                                type="number"
                                                min={0}
                                                value={data.minimum_similar_contracts}
                                                onChange={(e) => setData('minimum_similar_contracts', e.target.value ? parseInt(e.target.value, 10) : '')}
                                                className="h-11"
                                                placeholder="2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimum_contract_value" className="text-sm font-medium text-gray-700">
                                                Minimum Value per Contract (ETB)
                                            </Label>
                                            <Input
                                                id="minimum_contract_value"
                                                type="number"
                                                min={0}
                                                value={data.minimum_contract_value}
                                                onChange={(e) => setData('minimum_contract_value', e.target.value ? parseInt(e.target.value, 10) : '')}
                                                className="h-11"
                                                placeholder="2,000,000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimum_annual_turnover" className="text-sm font-medium text-gray-700">
                                                Minimum Annual Turnover (ETB)
                                            </Label>
                                            <Input
                                                id="minimum_annual_turnover"
                                                type="number"
                                                min={0}
                                                value={data.minimum_annual_turnover}
                                                onChange={(e) => setData('minimum_annual_turnover', e.target.value ? parseInt(e.target.value, 10) : '')}
                                                className="h-11"
                                                placeholder="5,000,000"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
                                <CardHeader className="pb-5 cursor-pointer" onClick={() => setShowLegalRequirements(!showLegalRequirements)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue/10 text-blue flex h-10 w-10 items-center justify-center rounded-xl">
                                                <Scale className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-gray-900">Legal & Tax Requirements</CardTitle>
                                                <CardDescription>
                                                    Mandatory compliance documents for supplier eligibility
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="font-medium text-gray-700">{activeComplianceCount} required</span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${showLegalRequirements ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </CardHeader>
                                {showLegalRequirements && (
                                    <CardContent className="pt-0">
                                        <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-600">
                                                These requirements act as mandatory procurement filters. Suppliers must satisfy all selected requirements.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                {
                                                    id: 'require_valid_trade_license',
                                                    label: 'Business License',
                                                    description: 'Supplier must have a valid business license.',
                                                    alwaysRequired: true,
                                                },
                                                {
                                                    id: 'require_tax_clearance',
                                                    label: 'Tax Clearance Certificate',
                                                    description: 'Supplier must provide valid tax clearance.',
                                                    alwaysRequired: false,
                                                },
                                                {
                                                    id: 'require_business_registration',
                                                    label: 'Business Registration',
                                                    description: 'Supplier must provide valid business registration certificate.',
                                                    alwaysRequired: true,
                                                },
                                                {
                                                    id: 'require_tin_certificate',
                                                    label: 'TIN Certificate',
                                                    description: 'Supplier must provide Tax Identification Number certificate.',
                                                    alwaysRequired: true,
                                                },
                                                {
                                                    id: 'require_vat_registration_certificate',
                                                    label: 'VAT Registration Certificate',
                                                    description: 'Supplier must provide VAT registration certificate.',
                                                    alwaysRequired: true,
                                                },
                                                {
                                                    id: 'require_egp_registration_letter',
                                                    label: 'EGP Registration Letter',
                                                    description: 'Supplier must provide EGP registration letter.',
                                                    alwaysRequired: true,
                                                },
                                            ].map((item) => {
                                                const isSupply = data.procurement_type === 'supply';
                                                const isRequired = item.alwaysRequired || (item.id === 'require_tax_clearance' && !isSupply);
                                                const isDisabled = item.id === 'require_tax_clearance' && isSupply;
                                                const checked = isRequired;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                            checked
                                                                ? 'border-emerald-200 bg-emerald-50'
                                                                : 'border-gray-200 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-emerald-500 bg-emerald-500">
                                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Label htmlFor={item.id} className="text-sm font-medium text-gray-900 truncate">
                                                                {item.label}
                                                            </Label>
                                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                                            {isDisabled && (
                                                                <p className="text-xs text-amber-600">Not required for this procurement type</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            <div className="flex items-center justify-center border-t border-gray-200 pt-6">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 bg-[#00515F] px-8 text-sm font-medium text-white hover:bg-[#00515F]/90"
                                >
                                    {processing ? 'Submitting...' : 'Submit Supplier Request'}
                                    <span className="ml-1">→</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </AdminLayout>
        );
    }

    // Table view (default)
    return (
        <AdminLayout>
            <Head title={title} />

            <div className="mb-8">
                <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/proc/dashboard" className="hover:text-teal transition-colors">
                        Procurement
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-gray-900">Supplier Requests</span>
                </nav>
                <div className="overflow-hidden rounded-2xl bg-[#00515F] text-white shadow-sm">
                    <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">Procurement workspace</p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Supplier requests</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                                    Create and track the supplier requirements for your procurement projects.
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => { setShowForm(true); setRoFileName(''); setTechSpecFileName(''); }} className="w-fit gap-2 bg-white text-[#00515F] shadow-sm hover:bg-white/90">
                            <Plus className="h-4 w-4" />
                            New request
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                            <Activity className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/80">Track review progress</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                            <ShieldCheck className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/80">Monitor supplier eligibility</span>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3.5 sm:px-8">
                            <Users className="h-4 w-4 text-[#8de1e9]" />
                            <span className="text-sm text-white/80">Review selected suppliers</span>
                        </div>
                    </div>
                </div>
            </div>

            {success && (
                <Alert className="mb-6 border-emerald-200 bg-emerald-50">
                    <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-800">Success</AlertTitle>
                    <AlertDescription className="text-emerald-700">Your supplier request has been submitted successfully.</AlertDescription>
                </Alert>
            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total requests', value: stats.total, icon: ClipboardList, tone: 'bg-slate-100 text-slate-700' },
                    { label: 'Submitted', value: stats.submitted, icon: CalendarDays, tone: 'bg-sky-50 text-sky-700' },
                    { label: 'Under review', value: stats.underReview, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
                ].map((stat) => (
                    <Card key={stat.label} className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.12em] text-gray-500 uppercase">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                            </div>
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                                <stat.icon className="h-5 w-5" />
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                <CardContent className="p-0">
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Your requests</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Showing {filteredRequests.length} of {requests.length} {requests.length === 1 ? 'request' : 'requests'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="relative block sm:w-64">
                                <span className="sr-only">Search requests</span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search request or category"
                                    className="focus:border-teal focus:ring-teal/15 h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-2"
                                />
                            </label>
                            <label className="relative block sm:w-40">
                                <span className="sr-only">Filter by status</span>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="focus:border-teal focus:ring-teal/15 h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 transition outline-none focus:ring-2"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="draft">Draft</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] text-left text-sm">
                            <thead className="bg-gradient-to-r from-[#00515F] to-[#007a8a] text-white">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">#</th>
                                    <th className="px-5 py-3 font-semibold">Request</th>
                                    <th className="px-5 py-3 font-semibold">Category & Type</th>
                                    <th className="px-5 py-3 font-semibold">Procurement Method</th>
                                    <th className="px-5 py-3 font-semibold">RO Number</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold">Submitted</th>
                                    <th className="px-6 py-3 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((item, index) => (
                                    <tr key={item.id} className="group transition-colors hover:bg-slate-50/70">
                                        <td className="px-4 py-3.5 text-gray-500 font-mono text-sm">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-teal/10 text-dark-teal flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                                                    <ClipboardList className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-gray-900">PR-{String(item.id).padStart(6, '0')}</p>
                                                    <p className="mt-0.5 text-xs text-gray-500">Supplier request</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {procurementTypeLabel(item.procurement_type)}
                                                </span>
                                                <p className="font-medium text-gray-800">{item.primary_business_category || '-'}</p>
                                                {item.subcategory && <p className="text-xs text-gray-500">{item.subcategory}</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                {procurementMethodLabel(item.procurement_method)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-700 font-mono text-sm">
                                            {item.ro_number || '-'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                                                {statusLabel(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-600">
                                            {item.submitted_at
                                                ? new Date(item.submitted_at).toLocaleDateString('en-GB', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <Link
                                                href={`/proc/requests/${item.id}`}
                                                className="text-dark-teal hover:bg-teal/10 inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                                                title="View details"
                                            >
                                                <ExternalLink className="h-4.5 w-4.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <Inbox className="h-7 w-7" />
                                                </div>
                                                <p className="mt-4 text-base font-semibold text-gray-900">
                                                    {requests.length === 0 ? 'No supplier requests yet' : 'No matching requests'}
                                                </p>
                                                <p className="mt-1 max-w-sm text-sm text-gray-500">
                                                    {requests.length === 0
                                                        ? 'Create your first request to start finding qualified suppliers.'
                                                        : 'Try a different search term or status filter.'}
                                                </p>
                                                {requests.length === 0 && (
                                                    <Button
                                                        onClick={() => { setShowForm(true); setRoFileName(''); setTechSpecFileName(''); }}
                                                        className="mt-5 gap-2 bg-[#00515F] text-white hover:bg-[#00515F]/90"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        New request
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="px-3 text-sm font-medium text-gray-700">
                                        {currentPage}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
