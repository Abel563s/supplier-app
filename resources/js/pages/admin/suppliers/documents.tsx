import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface AdminDocumentReviewProps {
    isAdmin: boolean;
    supplier: {
        id: number;
        legal_name: string;
    };
    documents: Array<{
        id: number;
        document_type: string;
        file_name: string;
        file_size: number;
        review_status: string;
        review_notes: string;
        uploaded_at: string;
    }>;
}

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    verified: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    replacement_required: 'bg-orange-50 text-orange-700',
    not_applicable: 'bg-gray-100 text-gray-500',
};

export default function AdminDocumentReview({ supplier, documents, isAdmin }: AdminDocumentReviewProps) {
    const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
    const [reviewStatus, setReviewStatus] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleUpdate = async () => {
        if (!selectedDocument) return;
        setSubmitting(true);

        await router.post(`/admin/suppliers/${supplier.id}/documents/${selectedDocument}`, {
            review_status: reviewStatus,
            review_notes: reviewNotes,
        });

        setSubmitting(false);
        setSelectedDocument(null);
        setReviewStatus('');
        setReviewNotes('');
    };

    const selectDocument = (doc: typeof documents[0]) => {
        setSelectedDocument(doc.id);
        setReviewStatus(doc.review_status);
        setReviewNotes(doc.review_notes || '');
    };

    const selected = documents.find((d) => d.id === selectedDocument);

    return (
        <AdminLayout>
            <Head title={`Documents - ${supplier.legal_name}`} />

            <div className="mb-6">
                <Link href={`/admin/suppliers/${supplier.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#00515F]">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Supplier
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-[28px] font-bold text-gray-900">Documents</h1>
                <p className="mt-2 text-base text-gray-600">Review and verify supplier documents for {supplier.legal_name}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    {documents.map((doc) => (
                        <Card
                            key={doc.id}
                            className={`${isAdmin ? 'cursor-pointer' : ''} transition-all ${
                                selectedDocument === doc.id ? 'ring-2 ring-[#00515F]' : 'hover:shadow-md'
                            }`}
                            onClick={isAdmin ? () => selectDocument(doc) : undefined}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00515F]/10">
                                            <FileText className="h-5 w-5 text-[#00515F]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{doc.document_type.replace(/_/g, ' ')}</h3>
                                            <p className="text-sm text-gray-600">{doc.file_name}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={statusColors[doc.review_status] || 'bg-gray-100 text-gray-700'}>
                                            {doc.review_status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <a
                                    href={`/admin/suppliers/${supplier.id}/documents/${doc.id}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex text-sm font-medium text-[#00515F] hover:underline"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    View document
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                    {documents.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-sm text-gray-500">No documents submitted.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>{isAdmin ? 'Review Document' : 'Read-only documents'}</CardTitle>
                            {selected && (
                                <p className="text-sm text-gray-500">{selected.document_type.replace(/_/g, ' ')}</p>
                            )}
                        </CardHeader>
                        {isAdmin ? (
                            <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="review_status">Status</Label>
                                <select
                                    id="review_status"
                                    value={reviewStatus}
                                    onChange={(e) => setReviewStatus(e.target.value)}
                                    disabled={!selectedDocument}
                                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:outline-none focus:ring-2 focus:ring-[#00515F]/20 disabled:opacity-50"
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
                                    disabled={!selectedDocument}
                                />
                            </div>
                            <Button
                                className="w-full bg-[#00515F] text-white hover:bg-[#00515F]/90"
                                disabled={!selectedDocument || !reviewStatus || submitting}
                                onClick={handleUpdate}
                            >
                                {submitting ? 'Updating...' : 'Update Review'}
                            </Button>
                            </CardContent>
                        ) : (
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    Department reviewers can view submitted files, but cannot change document statuses or notes.
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
