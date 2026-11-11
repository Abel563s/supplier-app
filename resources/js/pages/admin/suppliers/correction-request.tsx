import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface AdminCorrectionRequestProps {
    supplier: {
        id: number;
        legal_name: string;
    };
}

export default function AdminCorrectionRequest({ supplier }: AdminCorrectionRequestProps) {
    const { data, setData, post, processing, errors } = useForm({
        section: '',
        reason: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/admin/suppliers/${supplier.id}/correction-request`, {
            onSuccess: () => {
                setData({ section: '', reason: '' });
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`Request Correction - ${supplier.legal_name}`} />

            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href={`/admin/suppliers/${supplier.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#00515F]">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Supplier
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-[28px] font-bold text-gray-900">Request Correction</h1>
                    <p className="mt-2 text-base text-gray-600">Send a correction request to {supplier.legal_name}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Correction Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <Label htmlFor="section">Section</Label>
                                <select
                                    id="section"
                                    value={data.section}
                                    onChange={(e) => setData('section', e.target.value)}
                                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:outline-none focus:ring-2 focus:ring-[#00515F]/20"
                                >
                                    <option value="">Select section</option>
                                    <option value="legal_entity">Legal Entity</option>
                                    <option value="contact">Contact</option>
                                    <option value="business_scope">Business Scope</option>
                                    <option value="financial">Financial</option>
                                    <option value="ownership">Ownership</option>
                                    <option value="documents">Documents</option>
                                    <option value="declaration">Declaration</option>
                                </select>
                                {errors.section && <p className="mt-1 text-sm text-red-600">{errors.section}</p>}
                            </div>
                            <div>
                                <Label htmlFor="reason">Reason / Message</Label>
                                <Textarea
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="Please describe what needs to be corrected..."
                                    rows={5}
                                    className="mt-1.5"
                                />
                                {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" asChild>
                                    <Link href={`/admin/suppliers/${supplier.id}`}>Cancel</Link>
                                </Button>
                                <Button className="bg-[#00515F] text-white hover:bg-[#00515F]/90" type="submit" disabled={processing}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {processing ? 'Sending...' : 'Send Correction Request'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
