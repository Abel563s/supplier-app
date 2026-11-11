import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
    return (
        <AdminLayout>
            <Head title="Settings" />

            <div className="mb-8">
                <h1 className="text-[32px] font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-base text-gray-600">Manage supplier registration settings</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">Manage available business categories for supplier registration.</p>
                        <Button className="mt-4 bg-[#00515F] text-white hover:bg-[#00515F]/90">Manage Categories</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Legal Forms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">Manage available legal entity forms.</p>
                        <Button className="mt-4 bg-[#00515F] text-white hover:bg-[#00515F]/90">Manage Legal Forms</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Document Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">Configure required and optional documents for supplier registration.</p>
                        <Button className="mt-4 bg-[#00515F] text-white hover:bg-[#00515F]/90">Manage Documents</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Registration Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">Configure registration behavior and validation rules.</p>
                        <Button className="mt-4 bg-[#00515F] text-white hover:bg-[#00515F]/90">Manage Settings</Button>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
