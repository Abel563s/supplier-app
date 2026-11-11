import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminReportsProps {
    stats: {
        total: number;
        draft: number;
        submitted: number;
        under_review: number;
        needs_correction: number;
        approved: number;
        rejected: number;
    };
}

export default function AdminReports({ stats }: AdminReportsProps) {
    const reports = [
        { title: 'Supplier Registration Report', description: 'Export all supplier registrations with status and dates', action: 'Export CSV' },
        { title: 'Status Summary', description: 'Summary of suppliers by current status', action: 'Export CSV' },
        { title: 'Category Summary', description: 'Number of suppliers by business category', action: 'Export CSV' },
        { title: 'Procurement Type Report', description: 'Supply vs Service breakdown', action: 'Export CSV' },
        { title: 'Document Status Report', description: 'Verified, pending, and replacement required documents', action: 'Export CSV' },
    ];

    return (
        <AdminLayout>
            <Head title="Reports" />

            <div className="mb-8">
                <h1 className="text-[32px] font-bold text-gray-900">Reports</h1>
                <p className="mt-2 text-base text-gray-600">Generate and export supplier reports</p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
                        <p className="mt-3 text-[32px] font-bold text-gray-900">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm font-medium text-gray-500">Pending Review</p>
                        <p className="mt-3 text-[32px] font-bold text-gray-900">{stats.under_review}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm font-medium text-gray-500">Approved</p>
                        <p className="mt-3 text-[32px] font-bold text-gray-900">{stats.approved}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm font-medium text-gray-500">Rejected</p>
                        <p className="mt-3 text-[32px] font-bold text-gray-900">{stats.rejected}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.title} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                    <p className="text-sm text-gray-600">{report.description}</p>
                                </div>
                                <Button variant="outline">{report.action}</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
