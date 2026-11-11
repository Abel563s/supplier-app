import { Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { UploadCloud, FileText, X, Eye } from 'lucide-react';
import SupplierLayout, { stepMetadata } from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import type { SupplierDocumentType } from '@/types';
import { csrfHeaders } from '@/lib/csrf';

export interface DocumentsProps {
    step: number;
    canRemoveDocuments: boolean;
    documentTypes: SupplierDocumentType[];
    documents: Array<{
        id: number;
        document_type: string;
        file_name: string;
        file_size: number;
        uploaded_at?: string;
    }>;
}

function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function Documents({ step, canRemoveDocuments, documentTypes, documents }: DocumentsProps) {
    const [uploading, setUploading] = useState<string | null>(null);
    const { post, processing } = useForm();

    const requiredDocuments = useMemo(() => documentTypes.filter((documentType) => documentType.required), [documentTypes]);

    const uploadedTypes = useMemo(() => {
        return (documents || []).reduce<Record<string, boolean>>((acc, doc) => {
            acc[doc.document_type] = true;
            return acc;
        }, {});
    }, [documents]);

    const uploadedCount = Object.keys(uploadedTypes).length;
    const requiredUploadedCount = requiredDocuments.filter((documentType) => uploadedTypes[documentType.key]).length;

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/documents', {
            onSuccess: () => {},
        });
    };

    const isFilled = (value: unknown): boolean => {
        return value !== '' && value !== null && value !== undefined && value !== false;
    };

    const sectionStatus = (): { status: 'complete' | 'partial' | 'not-started'; missingItems: string[] } => {
        if (requiredUploadedCount === requiredDocuments.length) {
            return { status: 'complete', missingItems: [] };
        }
        if (requiredUploadedCount > 0) {
            const missing = requiredDocuments
                .filter((dt) => !uploadedTypes[dt.key])
                .map((dt) => dt.label);
            return { status: 'partial', missingItems: missing };
        }

        return { status: 'not-started', missingItems: requiredDocuments.map((dt) => dt.label) };
    };

    const documentsSection = sectionStatus();

    const handleUpload = useCallback(async (documentType: string, file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are accepted.');
            return;
        }

        setUploading(documentType);
        const form = new FormData();
        form.append('document_type', documentType);
        form.append('file', file);

        try {
            const response = await fetch('/supplier/registration/documents/upload', {
                method: 'POST',
                credentials: 'same-origin',
                body: form,
                headers: csrfHeaders(),
            });

            if (!response.ok) {
                const errors = await response.json().catch(() => null);
                const message = errors?.errors ? Object.values(errors.errors)[0] : null;
                alert(Array.isArray(message) ? message[0] : 'Failed to upload document. Please try again.');
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('An error occurred while uploading. Please try again.');
        } finally {
            setUploading(null);
        }
    }, []);

    const handleRemove = useCallback(async (documentId: number) => {
        try {
            const response = await fetch(`/supplier/registration/documents/${documentId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Remove failed:', response.status, text);
                alert('Failed to remove document. Please try again.');
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error('Error removing document:', error);
            alert('An error occurred while removing the document. Please try again.');
        }
    }, []);

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Supporting Documents" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title={stepMetadata[step]?.title || 'Supporting Documents'}
                        description={stepMetadata[step]?.description || 'Upload the documents required to support your supplier registration.'}
                        icon={<UploadCloud className="h-5 w-5" />}
                        status={documentsSection.status}
                        missingItems={documentsSection.missingItems}
                    >
                        <div className="mt-6 rounded-xl border border-teal/20 bg-teal/5 p-4">
                            <p className="text-xs text-teal">
                                The following {requiredDocuments.length} documents are required: {requiredDocuments.map((documentType) => documentType.label).join(', ')}. Accepted format: PDF. Maximum file size: 5 MB per document.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Documents uploaded</p>
                                <p className="text-sm text-gray-500">
                                    {uploadedCount} / {documentTypes.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Required: {requiredDocuments.map((documentType) => documentType.label).join(', ')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {documentTypes.map((documentType) => {
                                const docType = documentType.key;
                                const doc = (documents || []).find((d) => d.document_type === docType);
                                const isUploaded = !!doc;
                                const isUploadingThis = uploading === docType;

                                return (
                                    <div key={docType} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {documentType.label}
                                                    {documentType.required && (
                                                        <span className="ml-1 text-red-500">*</span>
                                                    )}
                                                </h3>
                                                {isUploaded && (
                                                    <Badge className="bg-teal/10 text-teal">Uploaded</Badge>
                                                )}
                                                {!isUploaded && (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">Not uploaded</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {isUploadingThis && (
                                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                                                <div className="flex-1">
                                                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                                                    <div className="mt-2 h-2 w-full animate-pulse rounded bg-gray-200" />
                                                </div>
                                            </div>
                                        )}

                                        {!isUploaded && !isUploadingThis && (
                                            <label
                                                htmlFor={`upload-${docType}`}
                                                className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-4 transition-colors hover:border-teal hover:bg-teal/5"
                                            >
                                                <UploadCloud className="h-5 w-5 text-gray-400" />
                                                <p className="mt-2 text-xs font-medium text-gray-700">Drag & drop</p>
                                                <p className="text-xs text-teal">Browse</p>
                                                <p className="mt-1 text-[11px] text-gray-400">PDF • Max 5 MB</p>
                                                <input
                                                    id={`upload-${docType}`}
                                                    type="file"
                                                    accept=".pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUpload(docType, file);
                                                    }}
                                                />
                                            </label>
                                        )}

                                        {isUploaded && doc && (
                                            <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10">
                                                        <FileText className="h-4 w-4 text-teal" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-gray-900">{doc.file_name}</p>
                                                        <p className="text-[11px] text-gray-500">
                                                            {formatFileSize(doc.file_size)} {doc.uploaded_at && `• ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/supplier/registration/documents/${doc.id}/view`, '_blank')}>
                                                        <Eye className="h-3.5 w-3.5 text-gray-600" />
                                                    </Button>
                                                    {canRemoveDocuments ? (
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(doc.id)}>
                                                            <X className="h-3.5 w-3.5 text-gray-600" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-500">Submitted</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/ownership" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <Button onClick={(e) => { e.preventDefault(); nextStep(e as unknown as React.FormEvent); }} disabled={processing || requiredUploadedCount < requiredDocuments.length} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </form>
        </SupplierLayout>
    );
}
