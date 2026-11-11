import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, Check, CheckCircle2, Eye, FileUp, History, Send, Trash2, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useMemo } from 'react';
import type { SupplierDocumentType } from '@/types';
import { csrfHeaders } from '@/lib/csrf';

const legalFormLabels: Record<string, string> = {
    sole_proprietorship: 'Sole Proprietorship',
    partnership: 'Partnership',
    private_limited: 'Private Limited Company',
    public_limited: 'Public Limited Company',
    cooperative: 'Cooperative',
    ngo: 'NGO / Non Profit',
    plc: 'PLC',
    share_company: 'Share Company',
};

const formatLegalForm = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const normalizedValue = value.trim();
    const normalizedKey = normalizedValue.toLowerCase().replace(/[\s/-]+/g, '_');

    return legalFormLabels[normalizedKey] ?? normalizedValue;
};

const formatProcurementTypes = (list?: string[] | null) => {
    if (!list || list.length === 0) {
        return '-';
    }

    return list.map((type) => procurementTypeLabels[type] ?? type).join(', ');
};

const parseDateOnly = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return new Date(year, month - 1, day);
};

const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numericValue = typeof value === 'string' ? Number(value) : value;

    if (Number.isNaN(numericValue)) {
        return String(value);
    }

    return `ETB ${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const taxExpiryHint = (expiry: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = parseDateOnly(expiry);
    const daysRemaining = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        const days = Math.abs(daysRemaining);

        return `Expired ${days} day${days === 1 ? '' : 's'} ago`;
    }

    if (daysRemaining === 0) {
        return 'Expires today';
    }

    if (daysRemaining <= 7) {
        return `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
    }

    if (daysRemaining <= 30) {
        return `Expires in ${daysRemaining} days`;
    }

    return `Valid for ${daysRemaining} days`;
};

interface AdminSupplierShowProps {
    supplier: {
        id: number;
        legal_name: string;
        trade_name: string;
        legal_form: string;
        country_of_registration: string;
        tin: string;
        business_registration_no: string;
        vat_registered: boolean;
        vat_registration_no: string;
        registered_capital: number;
        latest_annual_turnover: number;
        date_established: string;
        trade_license_renewed_date: string;
        primary_contact_name: string;
        primary_phone: string;
        alternate_phone: string;
        primary_email: string;
        alternate_email: string;
        city: string;
        subcity: string;
        woreda: string;
        procurement_type: string;
        procurement_type_list: string[];
        procurement_grades: Record<string, Record<string, number>> | null;
        approval_department: string | null;
        approval_stage: string;
        department_review_status: string | null;
        primary_business_category: string;
        sub_category: string;
        specialization: string;
        products_services_description: string;
        bank_name: string;
        branch_name: string;
        account_number: string;
        account_holder_name: string;
        number_of_employees: number;
        technical_personnel: string | null;
        non_technical_personnel: string | null;
        tax_clearance_expiry: string;
        tax_clearance_from: string;
        tax_clearance_to: string;
        tax_clearance_fiscal_year: string;
        subject_to_excise_tax: boolean;
        authorized_manufacturer_distributor: boolean;
        signatory_title: string;
        owner_ceo_name: string;
        declaration_confirmed: boolean;
        status: string;
        submitted_at: string | null;
        created_at: string;
        updated_at: string;
    };
    documents: Array<{
        id: number;
        document_type: string;
        file_name: string;
        file_size: number;
        review_status: string;
        review_notes: string;
        uploaded_at: string | null;
    }>;
    documentTypes: SupplierDocumentType[];
    contracts: Array<{
        id: number;
        client_project_name: string;
        nature_similarity: string;
        contract_value: string;
        contract_date: string;
    }>;
    statusHistory: Array<{
        id: number;
        previous_status: string;
        new_status: string;
        notes: string;
        created_at: string;
        changer: { name: string };
    }>;
    correctionRequests: Array<{
        id: number;
        section: string;
        reason: string;
        created_at: string;
        requester: { name: string };
        resolved_at: string | null;
    }>;
    reviewHistory: Array<{
        id: number;
        event_type: string;
        department: string | null;
        actor: { name: string } | null;
        department_role: { name: string } | null;
        grade_snapshot: Record<string, Record<string, number>> | null;
        notes: string | null;
        created_at: string;
    }>;
    departments: Array<{ key: string; name: string }>;
    gradeGroups: Array<{
        key: string;
        label: string;
        criteria: Array<{ key: string; label: string; maximumScore: number }>;
        maximumScore: number;
        contributionPercent: number | null;
    }>;
    departmentReviews: Array<{
        department: string;
        status: string;
        department_role: { name: string } | null;
    }>;
    reviewingDepartmentName: string | null;
    isAdmin: boolean;
    isDepartmentReviewer: boolean;
    canGrade: boolean;
    canInitiateHandoff: boolean;
    canManageAdminReview: boolean;
    isSupplierApproved: boolean;
    isDepartmentReview: boolean;
    canApproveDepartment: boolean;
    departmentGrades: Record<string, Record<string, number>> | null;
}

const procurementTypeLabels: Record<string, string> = {
    supply: 'Supply',
    service: 'Subcontract works & Services',
    consulting: 'Consulting',
    'non-consulting': 'Non-Consulting',
    both: 'Supply, Subcontract works & Services',
};

const formatDate = (value: string | null | undefined) => {
    if (!value) {
        return '-';
    }

    const [year, month, day] = value.slice(0, 10).split('-');

    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    under_review: 'bg-amber-50 text-amber-700',
    needs_correction: 'bg-orange-50 text-orange-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
};

const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const departmentReviewStatusLabel = (status: string) => status === 'completed' ? 'Approved' : 'Pending';

const reviewEventLabels: Record<string, string> = {
    admin_graded: 'Initial Admin grades saved',
    department_assigned: 'Department review assigned',
    department_graded: 'Departmental grades saved',
    department_approved: 'Department review completed',
};

const InfoRow = ({ label, value, hint }: { label: string; value: string | number | null | undefined; hint?: string }) => (
    <div className="min-w-0 rounded-xl bg-slate-50/80 p-3.5">
        <Label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{label}</Label>
        <p className="mt-1.5 text-sm font-medium break-words text-gray-900">{value || '-'}</p>
        {hint && <p className="mt-1 text-xs font-semibold">{hint}</p>}
    </div>
);

export default function AdminSupplierShow({
    supplier,
    documents,
    documentTypes,
    contracts,
    statusHistory,
    correctionRequests,
    reviewHistory,
    departments,
    departmentReviews,
    gradeGroups,
    reviewingDepartmentName,
    isAdmin,
    isDepartmentReviewer,
    canGrade,
    canInitiateHandoff,
    canManageAdminReview,
    isSupplierApproved,
    isDepartmentReview,
    canApproveDepartment,
    departmentGrades,
}: AdminSupplierShowProps) {
    const savedGrades = isAdmin ? supplier.procurement_grades : departmentGrades;
    const initialGrades = gradeGroups.reduce<Record<string, Record<string, string | number>>>((grades, group) => {
        grades[group.key] = group.criteria.reduce<Record<string, string | number>>((scores, criterion) => {
            scores[criterion.key] = savedGrades?.[group.key]?.[criterion.key] ?? '';

            return scores;
        }, {});

        return grades;
    }, {});
    const { data: gradeData, setData: setGradeData, post: submitGrades, processing: gradesProcessing, errors: gradeErrors } = useForm({
        grades: initialGrades,
    });
    const [approveOpen, setApproveOpen] = useState(false);
    const [departmentApproveOpen, setDepartmentApproveOpen] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reviewDocId, setReviewDocId] = useState<number | null>(null);
    const [reviewStatus, setReviewStatus] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [uploadingDocumentType, setUploadingDocumentType] = useState<string | null>(null);
    const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

    const handleGradeSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitGrades(
            isAdmin
                ? `/admin/suppliers/${supplier.id}/grades`
                : `/admin/suppliers/${supplier.id}/departmental-grades`,
        );
    };

    const updateGrade = (groupKey: string, criterionKey: string, score: string) => {
        setGradeData('grades', {
            ...gradeData.grades,
            [groupKey]: {
                ...gradeData.grades[groupKey],
                [criterionKey]: score,
            },
        });
    };

    const handleApprove = () => {
        if (selectedDepartments.length === 0) return;
        setSubmitting(true);
        router.post(
            `/admin/suppliers/${supplier.id}/approve`,
            { departments: selectedDepartments },
            {
                onFinish: () => {
                    setSubmitting(false);
                    setApproveOpen(false);
                    setSelectedDepartments([]);
                },
            },
        );
    };

    const handleDepartmentApprove = () => {
        setSubmitting(true);
        router.post(
            `/admin/suppliers/${supplier.id}/departmental-approve`,
            {},
            {
                onFinish: () => {
                    setSubmitting(false);
                    setDepartmentApproveOpen(false);
                },
            },
        );
    };
    const handleReject = () => {
        if (!rejectReason.trim()) return;
        setSubmitting(true);
        router.post(
            `/admin/suppliers/${supplier.id}/reject`,
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

    const handleCorrection = () => {
        router.get(`/admin/suppliers/${supplier.id}/correction-request`);
    };

    const openReview = (doc: { id: number; review_status: string; review_notes: string }) => {
        setReviewDocId(doc.id);
        setReviewStatus(doc.review_status);
        setReviewNotes(doc.review_notes || '');
    };

    const handleReviewUpdate = () => {
        if (!reviewDocId) return;
        setReviewSubmitting(true);
        router.post(
            `/admin/suppliers/${supplier.id}/documents/${reviewDocId}`,
            {
                review_status: reviewStatus,
                review_notes: reviewNotes,
            },
            {
                onFinish: () => {
                    setReviewSubmitting(false);
                    setReviewDocId(null);
                    setReviewNotes('');
                },
            },
        );
    };

    const handleDocumentUpload = async (documentType: string, file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are accepted.');
            return;
        }

        setUploadingDocumentType(documentType);

        const form = new FormData();
        form.append('document_type', documentType);
        form.append('file', file);

        try {
            const response = await fetch(`/admin/suppliers/${supplier.id}/documents/upload`, {
                method: 'POST',
                credentials: 'same-origin',
                body: form,
                headers: csrfHeaders(),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const message = payload?.errors ? Object.values(payload.errors)[0] : null;
                alert(Array.isArray(message) ? message[0] : 'Failed to upload document. Please try again.');
                return;
            }

            router.reload({ only: ['documents'] });
        } catch (error) {
            console.error('Error uploading supplier document:', error);
            alert('An error occurred while uploading. Please try again.');
        } finally {
            setUploadingDocumentType(null);
        }
    };

    const handleDocumentDelete = (documentId: number) => {
        if (!window.confirm('Delete this document upload?')) {
            return;
        }

        setDeletingDocumentId(documentId);
        router.delete(`/admin/suppliers/${supplier.id}/documents/${documentId}`, {
            onFinish: () => setDeletingDocumentId(null),
        });
    };

    const documentUploadControl = (documentType: SupplierDocumentType) => (
        <label
            htmlFor={`upload-${supplier.id}-${documentType.key}`}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#00515F] hover:bg-[#00515F]/5 ${
                uploadingDocumentType === documentType.key ? 'pointer-events-none opacity-50' : ''
            }`}
        >
            <FileUp className="h-3.5 w-3.5" />
            {uploadingDocumentType === documentType.key ? 'Uploading' : 'Upload'}
            <input
                id={`upload-${supplier.id}-${documentType.key}`}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                disabled={uploadingDocumentType === documentType.key}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) {
                        void handleDocumentUpload(documentType.key, file);
                    }
                }}
            />
        </label>
    );

    const selectedDocument = documents.find((doc) => doc.id === reviewDocId);

    const documentStatusColors: Record<string, string> = {
        pending: 'bg-gray-100 text-gray-700',
        verified: 'bg-emerald-50 text-emerald-700',
        rejected: 'bg-red-50 text-red-700',
        replacement_required: 'bg-orange-50 text-orange-700',
        not_applicable: 'bg-gray-100 text-gray-500',
    };

    const documentRows = documentTypes.map((documentType) => {
        const uploads = documents.filter((doc) => doc.document_type === documentType.key);

        return { documentType, uploads };
    });

    const uploadedDocuments = documents.length;

    const documentLabels = useMemo(
        () => Object.fromEntries(documentTypes.map((documentType) => [documentType.key, documentType.label])),
        [documentTypes],
    );

    return (
        <AdminLayout>
            <Head title={`Supplier - ${supplier.legal_name}`} />

            <div className="mb-4">
                <Link
                    href="/admin/suppliers"
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-[#00515F]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Supplier directory
                </Link>
            </div>

            <div className="mb-6 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                            <Building2 className="h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Supplier review</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{supplier.legal_name}</h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusColors[supplier.status] || 'bg-white/15 text-white'}`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                    {supplier.status === 'under_review' ? 'Pending' : statusLabel(supplier.status)}
                                </span>
                            </div>
                            {supplier.trade_name && <p className="mt-1 text-sm text-white/70">{supplier.trade_name}</p>}
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
                                <span>
                                    <span className="font-semibold text-white/85">TIN</span> · {supplier.tin || '-'}
                                </span>
                                <span>
                                    <span className="font-semibold text-white/85">Registration</span> · {supplier.business_registration_no || '-'}
                                </span>
                                <span>
                                    <span className="font-semibold text-white/85">Submitted</span> ·{' '}
                                    {new Date(supplier.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                                            {departmentReviews.length > 0 && (
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                    {departmentReviews.map((review) => (
                                                        <span key={review.department} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/90">
                                                            {review.department_role?.name ?? review.department}: {departmentReviewStatusLabel(review.status)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:max-w-[390px] lg:justify-end">
                        {isAdmin && canManageAdminReview && (
                            <>
                                <Button
                                    size="sm"
                                    className="h-10 rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-600"
                                    onClick={() => setApproveOpen(true)}
                                    disabled={!canInitiateHandoff}
                                    title={!canInitiateHandoff ? 'Complete and save the initial grades before handing off.' : undefined}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-10 rounded-xl px-4" onClick={() => setRejectOpen(true)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-10 rounded-xl border-white/20 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
                                    onClick={() => setCorrectionOpen(true)}
                                >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Request Correction
                                </Button>
                            </>
                        )}
                        {isDepartmentReviewer && canApproveDepartment && (
                            <Button
                                size="sm"
                                className="h-10 rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-600"
                                onClick={() => setDepartmentApproveOpen(true)}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve Department Review
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isSupplierApproved && (
                <div
                    role="status"
                    className="mb-6 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm sm:items-center"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-base font-bold">Supplier approved</p>
                        <p className="mt-1 text-sm text-emerald-800">
                            All required department reviews are complete. No further approval action is required.
                        </p>
                    </div>
                </div>
            )}

            {isDepartmentReview && !isSupplierApproved && (
                <div
                    role="status"
                    className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm sm:items-center"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <AlertCircle className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-base font-bold">Pending department approval</p>
                        <p className="mt-1 text-sm text-amber-800">
                            The supplier will be approved after all assigned departments complete their reviews.
                        </p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="legal-entity">Legal Entity</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="business">Business Scope</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="ownership">Ownership</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="grade">Grade</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Company Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Legal Name" value={supplier.legal_name} />
                            <InfoRow label="Trade Name" value={supplier.trade_name} />
                            <InfoRow label="Legal Form" value={formatLegalForm(supplier.legal_form)} />
                            <InfoRow label="Country" value={supplier.country_of_registration} />
                            <InfoRow label="TIN" value={supplier.tin} />
                            <InfoRow label="Status" value={supplier.status === 'under_review' ? 'Pending' : statusLabel(supplier.status)} />
                            <InfoRow label="Primary Contact" value={supplier.primary_contact_name} />
                            <InfoRow label="Phone" value={supplier.primary_phone} />
                            <InfoRow label="Email" value={supplier.primary_email} />
                            <InfoRow label="Procurement Type" value={formatProcurementTypes(supplier.procurement_type_list)} />
                            <InfoRow label="Category" value={supplier.primary_business_category} />
                            <InfoRow label="Sub-category" value={supplier.sub_category} />
                            <InfoRow label="Submitted" value={formatDate(supplier.submitted_at)} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="legal-entity">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Legal Entity & Identification</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Legal Form" value={formatLegalForm(supplier.legal_form)} />
                            <InfoRow label="Country of Registration" value={supplier.country_of_registration} />
                            <InfoRow label="Company / Legal Name" value={supplier.legal_name} />
                            <InfoRow label="Trade Name" value={supplier.trade_name} />
                            <InfoRow label="TIN" value={supplier.tin} />
                            <InfoRow label="Business Registration No." value={supplier.business_registration_no} />
                            <InfoRow label="VAT Registered" value={supplier.vat_registered ? 'Yes' : 'No'} />
                            {supplier.vat_registered && <InfoRow label="VAT Registration No." value={supplier.vat_registration_no} />}
                            <InfoRow label="Registered Capital (ETB)" value={formatCurrency(supplier.registered_capital)} />
                            <InfoRow label="Latest Annual Turnover (ETB)" value={formatCurrency(supplier.latest_annual_turnover)} />
                            <InfoRow label="Date Established" value={formatDate(supplier.date_established)} />
                            <InfoRow label="Trade License Renewed Date" value={formatDate(supplier.trade_license_renewed_date)} />
                        </CardContent>
                    </Card>

                    <Card className="mt-6 rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Tax Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Tax Clearance From" value={formatDate(supplier.tax_clearance_from)} />
                            <InfoRow
                                label="Tax Clearance To"
                                value={formatDate(supplier.tax_clearance_to)}
                                hint={supplier.tax_clearance_to ? taxExpiryHint(supplier.tax_clearance_to) : undefined}
                            />
                            <InfoRow label="Tax Clearance Fiscal Year" value={supplier.tax_clearance_fiscal_year} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contact">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Contact & Location</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Primary Contact — Full Name" value={supplier.primary_contact_name} />
                            <InfoRow label="License Contact Number" value={supplier.primary_phone} />
                            <InfoRow label="Alternate / Sales Contact Number" value={supplier.alternate_phone} />
                            <InfoRow label="Email" value={supplier.primary_email} />
                            <InfoRow label="Alternate Email" value={supplier.alternate_email} />
                            <InfoRow label="City" value={supplier.city} />
                            <InfoRow label="Subcity" value={supplier.subcity} />
                            <InfoRow label="Woreda" value={supplier.woreda} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="business">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Business Scope & Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="md:col-span-2 lg:col-span-3">
                                <InfoRow label="Procurement Type" value={formatProcurementTypes(supplier.procurement_type_list)} />
                            </div>
                            <InfoRow label="Primary Business Category" value={supplier.primary_business_category} />
                            <InfoRow label="Sub-category" value={supplier.sub_category} />
                            <InfoRow label="Specialization" value={supplier.specialization} />
                            <div className="md:col-span-2 lg:col-span-3">
                                <InfoRow label="Products / Services Description" value={supplier.products_services_description} />
                            </div>
                        </CardContent>
                    </Card>

                    {contracts.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Similar Contracts & Experience</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Client / Project</th>
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Nature / Similarity</th>
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Value</th>
                                                <th className="pb-3 font-medium text-gray-500">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {contracts.map((contract) => (
                                                <tr key={contract.id}>
                                                    <td className="py-3 pr-4 font-medium text-gray-900">{contract.client_project_name}</td>
                                                    <td className="py-3 pr-4 text-gray-600">{contract.nature_similarity}</td>
                                                    <td className="py-3 pr-4 text-gray-900">{contract.contract_value}</td>
                                                    <td className="py-3 text-gray-600">
                                                        {new Date(contract.contract_date).toLocaleDateString('en-GB')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="financial">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Bank & Financial Information</CardTitle>
                            <p className="text-sm text-gray-500">Optional section</p>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Bank Name" value={supplier.bank_name} />
                            <InfoRow label="Branch Name" value={supplier.branch_name} />
                            <InfoRow label="Account Number" value={supplier.account_number} />
                            <InfoRow label="Account Holder Name" value={supplier.account_holder_name} />
                            <InfoRow label="Number of Employees" value={supplier.number_of_employees} />
                            <InfoRow label="Technical Personnel" value={supplier.technical_personnel} />
                            <InfoRow label="Non-Technical Personnel" value={supplier.non_technical_personnel} />
                            {supplier.tax_clearance_expiry && (
                                <InfoRow label="Tax Clearance Expiry (submitted earlier)" value={formatDate(supplier.tax_clearance_expiry)} />
                            )}
                            <InfoRow
                                label="Goods/services are subject to excise tax"
                                value={supplier.subject_to_excise_tax ? 'Yes' : 'No'}
                            />
                            <InfoRow
                                label="Authorized manufacturer / distributor"
                                value={supplier.authorized_manufacturer_distributor ? 'Yes' : 'No'}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ownership">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Ownership & Signatory</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <InfoRow label="Signatory Title" value={supplier.signatory_title} />
                            <InfoRow label="Owner / CEO Name" value={supplier.owner_ceo_name} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Supporting Documents</CardTitle>
                            <p className="text-sm text-gray-500">
                                {uploadedDocuments} upload{uploadedDocuments === 1 ? '' : 's'} across {documentTypes.length} document types
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="pr-4 pb-3 font-medium text-gray-500">Document</th>
                                            <th className="pr-4 pb-3 font-medium text-gray-500">File</th>
                                            <th className="pr-4 pb-3 font-medium text-gray-500">Uploaded</th>
                                            <th className="pr-4 pb-3 font-medium text-gray-500">Status</th>
                                            <th className="pb-3 text-right font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {documentRows.map(({ documentType, uploads }) =>
                                            uploads.length === 0 ? (
                                                <tr key={`${documentType.key}-empty`} className="bg-gray-50/60">
                                                    <td className="py-4 pr-4 font-medium text-gray-900">
                                                        {documentType.label}
                                                        {documentType.required && <span className="ml-1 text-red-500">*</span>}
                                                    </td>
                                                    <td className="py-4 pr-4 text-gray-600">Not uploaded</td>
                                                    <td className="py-4 pr-4 text-gray-600">—</td>
                                                    <td className="py-4 pr-4">
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                                                            Not uploaded
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">{isAdmin && documentUploadControl(documentType)}</td>
                                                </tr>
                                            ) : (
                                                uploads.map((document, index) => (
                                                    <tr key={document.id}>
                                                        <td className="py-4 pr-4 font-medium text-gray-900">
                                                            {documentType.label}
                                                            {documentType.required && <span className="ml-1 text-red-500">*</span>}
                                                            {uploads.length > 1 && (
                                                                <span className="mt-1 block text-xs font-normal text-gray-500">
                                                                    {index === 0 ? 'Latest upload' : 'Previous upload'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 pr-4 text-gray-600">{document.file_name}</td>
                                                        <td className="py-4 pr-4 text-gray-600">
                                                            {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString('en-GB') : '—'}
                                                        </td>
                                                        <td className="py-4 pr-4">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${documentStatusColors[document.review_status] || 'bg-gray-100 text-gray-700'}`}
                                                            >
                                                                {document.review_status.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <a
                                                                    href={`/admin/suppliers/${supplier.id}/documents/${document.id}/view`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center"
                                                                    aria-label={`View ${document.file_name}`}
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-[#00515F] hover:text-[#00353D]"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </a>
                                                                {isAdmin && (
                                                                    <>
                                                                        {index === 0 && documentUploadControl(documentType)}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-[#00515F] hover:text-[#00353D]"
                                                                            onClick={() => openReview(document)}
                                                                        >
                                                                            Review
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-red-600 hover:text-red-700"
                                                                            aria-label={`Delete ${document.file_name}`}
                                                                            disabled={deletingDocumentId === document.id}
                                                                            onClick={() => handleDocumentDelete(document.id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={!!reviewDocId} onOpenChange={(open) => !open && setReviewDocId(null)}>
                        <DialogContent key={reviewDocId}>
                            <DialogHeader>
                                <DialogTitle>Review Document</DialogTitle>
                            <DialogDescription>
                                {selectedDocument
                                    ? `${documentLabels[selectedDocument.document_type] ?? selectedDocument.document_type.replace(/_/g, ' ')} - ${selectedDocument.file_name}`
                                    : ''}
                            </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="review_status">Status</Label>
                                    <select
                                        id="review_status"
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                    >
                                        <option value="">Select status</option>
                                        <option value="pending">Pending</option>
                                        <option value="verified">Verified</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="replacement_required">Replacement Required</option>
                                        <option value="not_applicable">Not Applicable</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="review_notes">Notes</Label>
                                    <Textarea
                                        id="review_notes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add review notes..."
                                        rows={4}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setReviewDocId(null)} disabled={reviewSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-[#00515F] text-white hover:bg-[#00515F]/90"
                                    onClick={handleReviewUpdate}
                                    disabled={!reviewStatus || reviewSubmitting}
                                >
                                    {reviewSubmitting ? 'Saving...' : 'Save Review'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="contracts">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Similar Contracts & Experience</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contracts.length === 0 ? (
                                <p className="text-sm text-gray-500">No contracts submitted.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Client / Project</th>
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Nature / Similarity</th>
                                                <th className="pr-4 pb-3 font-medium text-gray-500">Value</th>
                                                <th className="pb-3 font-medium text-gray-500">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {contracts.map((contract) => (
                                                <tr key={contract.id}>
                                                    <td className="py-3 pr-4 font-medium text-gray-900">{contract.client_project_name}</td>
                                                    <td className="py-3 pr-4 text-gray-600">{contract.nature_similarity}</td>
                                                    <td className="py-3 pr-4 text-gray-900">{contract.contract_value}</td>
                                                    <td className="py-3 text-gray-600">
                                                        {new Date(contract.contract_date).toLocaleDateString('en-GB')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader>
                            <CardTitle>Status History & Correction Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <History className="h-4 w-4" />
                                        Approval Journey
                                    </h3>
                                    <div className="space-y-4">
                                        {reviewHistory.map((entry) => (
                                            <div key={entry.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="font-semibold text-gray-900">
                                                        {reviewEventLabels[entry.event_type] ?? statusLabel(entry.event_type)}
                                                    </span>
                                                    <time className="text-xs text-gray-500">
                                                        {new Date(entry.created_at).toLocaleString('en-GB')}
                                                    </time>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {entry.department_role?.name ?? 'Admin'} · {entry.actor?.name ?? 'Former user'}
                                                </p>
                                                {entry.notes && <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>}
                                                {entry.grade_snapshot && (
                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                        {Object.entries(entry.grade_snapshot).map(([type, scores]) => (
                                                            <p key={type} className="rounded-lg bg-slate-50 p-2 text-xs text-gray-700">
                                                                <span className="font-semibold">{procurementTypeLabels[type] ?? type}:</span>{' '}
                                                                {Object.entries(scores)
                                                                    .map(([criterion, score]) => `${statusLabel(criterion)} ${score}`)
                                                                    .join(' · ')}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {reviewHistory.length === 0 && (
                                            <p className="text-sm text-gray-500">No Admin or departmental review activity recorded.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <History className="h-4 w-4" />
                                        Status Changes
                                    </h3>
                                    <div className="space-y-4">
                                        {statusHistory.map((entry) => (
                                            <div key={entry.id} className="flex gap-4 border-l-2 border-gray-200 pl-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[entry.new_status] || 'bg-gray-100 text-gray-700'}`}
                                                        >
                                                            {statusLabel(entry.new_status)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(entry.created_at).toLocaleString('en-GB')}
                                                        </span>
                                                    </div>
                                                    {entry.notes && <p className="mt-1 text-sm text-gray-600">{entry.notes}</p>}
                                                    <p className="mt-1 text-xs text-gray-500">By {entry.changer?.name || 'System'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {statusHistory.length === 0 && <p className="text-sm text-gray-500">No status changes recorded.</p>}
                                    </div>
                                </div>

                                {correctionRequests.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <AlertCircle className="h-4 w-4" />
                                            Correction Requests
                                        </h3>
                                        <div className="space-y-4">
                                            {correctionRequests.map((request) => (
                                                <div key={request.id} className="rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">{request.section}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(request.created_at).toLocaleString('en-GB')}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-600">{request.reason}</p>
                                                    <p className="mt-2 text-xs text-gray-500">Requested by {request.requester?.name || 'Admin'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="grade">
                    <form onSubmit={handleGradeSubmit} className="space-y-6">
                        <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-900">
                            {isAdmin
                                ? 'Enter the initial Admin grades for each procurement type. Click a tick box to set the score up to that point, and click the highest ticked box again to lower it.'
                                : `Submitting as ${reviewingDepartmentName ?? 'your department'}. These grades use your department's rubric and are stored separately from Admin and other departments.`}
                        </div>

                        {gradeGroups.length > 0 ? (
                            <div className="grid gap-6">
                                {gradeGroups.map((group) => {
                                    const scores = gradeData.grades[group.key];
                                    const isComplete = group.criteria.every((criterion) => scores?.[criterion.key] !== '');
                                    const total = group.criteria.reduce((sum, criterion) => sum + Number(scores?.[criterion.key] || 0), 0);
                                    const contributionScore = group.contributionPercent === null
                                        ? null
                                        : Number(((total / group.maximumScore) * group.contributionPercent).toFixed(1));

                                    return (
                                        <Card key={group.key} className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                                            <CardHeader>
                                                <CardTitle>{group.label}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-5">
                                                {group.criteria.map((criterion) => {
                                                    const error = (gradeErrors as Record<string, string>)[
                                                        `grades.${group.key}.${criterion.key}`
                                                    ];
                                                    const currentScore = Number(scores?.[criterion.key] || 0);

                                                    return (
                                                        <div
                                                            key={criterion.key}
                                                            className="space-y-3"
                                                        >
                                                            <Label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                                {criterion.label}
                                                                <span className="text-sm font-normal text-gray-500">
                                                                    ({criterion.maximumScore} pts - currently {currentScore})
                                                                </span>
                                                            </Label>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {Array.from({ length: criterion.maximumScore }, (_, index) => index + 1).map((point) => {
                                                                    const isActive = currentScore >= point;

                                                                    return (
                                                                        <button
                                                                            key={point}
                                                                            type="button"
                                                                            aria-label={`Set ${criterion.label} score to ${point}`}
                                                                            aria-pressed={isActive}
                                                                            disabled={!canGrade}
                                                                            onClick={() => {
                                                                                const nextScore = currentScore === point ? point - 1 : point;

                                                                                updateGrade(
                                                                                    group.key,
                                                                                    criterion.key,
                                                                                    nextScore > 0 ? String(nextScore) : '',
                                                                                );
                                                                            }}
                                                                            className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                                isActive
                                                                                    ? 'border-teal-500 bg-teal-500 text-white'
                                                                                    : 'border-gray-300 bg-white text-gray-400 hover:border-teal-300 hover:bg-teal-50'
                                                                            }`}
                                                                        >
                                                                            {isActive ? <Check className="h-4 w-4 stroke-[3]" /> : point}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {error && (
                                                                <p
                                                                    id={`error-${group.key}-${criterion.key}`}
                                                                    className="text-sm text-red-600"
                                                                >
                                                                    {error}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-right text-sm font-semibold text-gray-700">
                                                    Total:{' '}
                                                    {isComplete
                                                        ? `${Number(total.toFixed(2))} / ${group.maximumScore} points${
                                                              contributionScore === null
                                                                  ? ''
                                                                  : ` · ${contributionScore} / ${group.contributionPercent}% contribution`
                                                          }`
                                                        : 'Complete all criteria'}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-2xl border-gray-200/80 shadow-sm">
                                <CardContent className="py-8 text-center text-sm text-gray-500">
                                    Add a procurement type to this supplier before grading.
                                </CardContent>
                            </Card>
                        )}

                        {canGrade ? (
                            gradeGroups.length > 0 && (
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={gradesProcessing}>
                                        {gradesProcessing ? 'Saving grades...' : 'Save grades'}
                                    </Button>
                                </div>
                            )
                        ) : (
                            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
                                {isDepartmentReviewer
                                    ? 'This department review has been completed. Grades are read-only.'
                                    : 'The initial Admin grading stage is complete. Saved grades are read-only.'}
                            </p>
                        )}
                    </form>
                </TabsContent>
            </Tabs>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select the Next Approval Department</DialogTitle>
                        <DialogDescription>
                            Select one or more departments to review this supplier. Final supplier approval remains pending until a separate Admin action.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="font-semibold text-gray-900">{supplier.legal_name}</p>
                        <p className="text-sm text-gray-600">{supplier.trade_name}</p>
                    </div>
                    <div className="space-y-3">
                        <Label>Select approval departments</Label>
                        <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
                            {departments.map((department) => {
                                const isSelected = selectedDepartments.includes(department.key);

                                return (
                                    <label
                                        key={department.key}
                                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                                            isSelected
                                                ? 'border-[#00515F] bg-[#00515F]/5 text-[#00515F]'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(event) =>
                                                setSelectedDepartments((current) =>
                                                    event.target.checked
                                                        ? [...current, department.key]
                                                        : current.filter((key) => key !== department.key),
                                                )
                                            }
                                            className="h-4 w-4 rounded border-gray-300 accent-[#00515F]"
                                        />
                                        <span className="font-medium">{department.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {selectedDepartments.length > 0 && (
                            <p className="text-sm text-gray-600">
                                Selected: <span className="font-semibold">{departments
                                    .filter((department) => selectedDepartments.includes(department.key))
                                    .map((department) => department.name)
                                    .join(', ')}</span>
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={handleApprove}
                            disabled={submitting || selectedDepartments.length === 0}
                        >
                            {submitting ? 'Assigning...' : `Confirm ${selectedDepartments.length || ''} Department${selectedDepartments.length === 1 ? '' : 's'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={departmentApproveOpen} onOpenChange={setDepartmentApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Department Review</DialogTitle>
                        <DialogDescription>
                            Confirm that this department has finished its review. This does not finally approve the supplier.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDepartmentApproveOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={handleDepartmentApprove}
                            disabled={submitting}
                        >
                            {submitting ? 'Completing...' : 'Complete Department Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Supplier</DialogTitle>
                        <DialogDescription>Are you sure you want to reject this supplier?</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="font-semibold text-gray-900">{supplier.legal_name}</p>
                        <p className="text-sm text-gray-600">{supplier.trade_name}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reject-reason">Reason for Rejection</Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Please provide a reason for rejecting this supplier..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || submitting}>
                            {submitting ? 'Rejecting...' : 'Reject Supplier'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Correction</DialogTitle>
                        <DialogDescription>Send a correction request back to the supplier.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="font-semibold text-gray-900">{supplier.legal_name}</p>
                        <p className="text-sm text-gray-600">{supplier.trade_name}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                        You will be redirected to the correction request form where you can specify the section and reason.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCorrection}>
                            <Send className="mr-2 h-4 w-4" />
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
