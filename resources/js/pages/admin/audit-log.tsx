import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminAuditLogProps {
    logs: {
        data: Array<{
            id: number;
            supplier: {
                legal_name: string;
            };
            previous_status: string;
            new_status: string;
            notes: string;
            created_at: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-50 text-blue-700',
    under_review: 'bg-amber-50 text-amber-700',
    needs_correction: 'bg-orange-50 text-orange-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
};

export default function AdminAuditLog({ logs }: AdminAuditLogProps) {
    return (
        <AdminLayout>
            <Head title="Audit Log" />

            <div className="mb-8">
                <h1 className="text-[32px] font-bold text-gray-900">Audit Log</h1>
                <p className="mt-2 text-base text-gray-600">Track all administrative actions</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Status Change History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr className="border-b border-gray-200">
                                    <th className="pb-3 pr-4 font-medium text-gray-500">Supplier</th>
                                    <th className="pb-3 pr-4 font-medium text-gray-500">Previous Status</th>
                                    <th className="pb-3 pr-4 font-medium text-gray-500">New Status</th>
                                    <th className="pb-3 pr-4 font-medium text-gray-500">Notes</th>
                                    <th className="pb-3 text-right font-medium text-gray-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.data.map((log) => (
                                    <tr key={log.id}>
                                        <td className="py-4 pr-4 font-medium text-gray-900">{log.supplier?.legal_name || 'Unknown'}</td>
                                        <td className="py-4 pr-4">
                                            {log.previous_status ? (
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[log.previous_status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {log.previous_status.replace(/_/g, ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[log.new_status] || 'bg-gray-100 text-gray-700'}`}>
                                                {log.new_status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-600">{log.notes || '-'}</td>
                                        <td className="py-4 text-right text-gray-500">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">No audit logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Showing {logs.data.length} entries</p>
                        <div className="flex gap-2">
                            {logs.links.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url || '#'}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-[#00515F] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
