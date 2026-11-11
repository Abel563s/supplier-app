import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowRight, Pencil, Search, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface AdminRolesProps {
    roles: Array<{ key: string; name: string; type: string }>;
    admins: {
        data: Array<{
            id: number;
            name: string;
            email: string;
            role: string;
            created_at: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
    };
    suppliers: {
        data: Array<{
            id: number;
            legal_name: string;
            trade_name: string;
            tin: string;
            primary_email: string;
            status: string;
            created_at: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
    };
}

export default function AdminRoles({ admins, suppliers, roles }: AdminRolesProps) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        status: 'active',
    });

    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [editingUser, setEditingUser] = useState<{ id: number; name: string; email: string; role: string; status: string } | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/roles', {
            onSuccess: () => {
                reset('password', 'password_confirmation');
                setOpen(false);
            },
        });
    };

    const openEdit = (admin: { id: number; name: string; email: string; role: string; status?: string }) => {
        setEditingUser({ ...admin, status: admin.status || 'active' });
        setData({
            name: admin.name,
            email: admin.email,
            password: '',
            password_confirmation: '',
            role: admin.role,
            status: admin.status || 'active',
        });
        setEditOpen(true);
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingUser) return;
        setSubmitting(true);
        router.put(`/admin/roles/${editingUser.id}`, data, {
            onFinish: () => {
                setSubmitting(false);
                setEditOpen(false);
                setEditingUser(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setIsDeleting(true);
        router.delete(`/admin/roles/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteId(null);
            },
        });
    };

    const roleLabel = (role: string) => roles.find((availableRole) => availableRole.key === role)?.name ?? role;

    const roleClass = (role: string) => {
        if (role === 'admin') return 'bg-[#00515F]/10 text-[#00515F]';
        if (role === 'procurement') return 'bg-[#00515F]/10 text-[#00515F]';
        return 'bg-gray-100 text-gray-700';
    };

    const adminQuery = adminSearch.trim().toLowerCase();
    const adminRows = admins.data.filter((admin) => {
        if (adminQuery === '') return true;

        return [admin.name, admin.email, roleLabel(admin.role)].join(' ').toLowerCase().includes(adminQuery);
    });

    const supplierQuery = supplierSearch.trim().toLowerCase();
    const supplierRows = suppliers.data.filter((supplier) => {
        if (supplierQuery === '') return true;

        return [supplier.legal_name, supplier.trade_name, supplier.tin, supplier.primary_email].join(' ').toLowerCase().includes(supplierQuery);
    });

    return (
        <AdminLayout>
            <Head title="Roles" />

            <div className="mb-6 overflow-hidden rounded-3xl bg-[#00515F] text-white shadow-sm">
                <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#8de1e9]">
                            <ShieldCheck className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">Access management</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">People & permissions</h1>
                            <p className="mt-2 text-sm text-white/70">Manage administrative access and review supplier account records.</p>
                        </div>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85">
                        <UserCog className="h-4 w-4" />
                        Role administration
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="roles" className="space-y-6">
                <TabsList className="h-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    <TabsTrigger value="roles" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-[#00515F] data-[state=active]:text-white">
                        Team roles
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-[#00515F] data-[state=active]:text-white">
                        Supplier accounts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid flex-1 grid-cols-2 gap-3">
                            {[
                                { label: 'Accounts on page', value: admins.data.length, icon: Users, tone: 'bg-slate-100 text-slate-700' },
                                { label: 'Available roles', value: roles.length, icon: ShieldCheck, tone: 'bg-teal/10 text-dark-teal' },
                            ].map((stat) => (
                                <Card key={stat.label} className="rounded-2xl border-gray-200/80 shadow-sm">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{stat.label}</p>
                                            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                                            <stat.icon className="h-5 w-5" />
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Role</DialogTitle>
                                    <DialogDescription>Create an account and assign it an available role.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1.5"
                                            required
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1.5"
                                            required
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="mt-1.5"
                                            required
                                            minLength={8}
                                        />
                                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="mt-1.5"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="role">Role</Label>
                                        <select
                                            id="role"
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                        >
                                            {roles.map((role) => (
                                                <option key={role.key} value={role.key}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" className="bg-[#00515F] text-white hover:bg-[#00515F]/90" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create Role'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button
                            className="h-11 shrink-0 gap-2 rounded-xl bg-[#00515F] px-5 text-white hover:bg-[#00515F]/90"
                            onClick={() => setOpen(true)}
                        >
                            <UserCog className="h-4 w-4" />
                            Create role
                        </Button>
                    </div>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Role</DialogTitle>
                                <DialogDescription>Update user role and status.</DialogDescription>
                            </DialogHeader>
                            <form id="edit-role-form" onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1.5"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1.5"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1.5"
                                        minLength={8}
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="edit-password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="mt-1.5"
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-role">Role</Label>
                                    <select
                                        id="edit-role"
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.key} value={role.key}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-status">Status</Label>
                                    <select
                                        id="edit-status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#00515F] focus:ring-2 focus:ring-[#00515F]/20 focus:outline-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        className="bg-[#00515F] text-white hover:bg-[#00515F]/90"
                                        disabled={processing || submitting}
                                    >
                                        {submitting ? 'Updating...' : 'Update Role'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">Roles</CardTitle>
                            <label className="relative block w-full sm:w-72">
                                <span className="sr-only">Search roles on this page</span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={adminSearch}
                                    onChange={(event) => setAdminSearch(event.target.value)}
                                    placeholder="Name, email, or role"
                                    className="focus:border-teal focus:ring-teal/15 h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-2"
                                />
                            </label>
                        </CardHeader>
                        <CardContent>
                    <div className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 z-10 bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                        <tr className="border-b border-white/10">
                                            <th className="py-3 pr-4 font-semibold text-white">#</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Name</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Email</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Role</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Created</th>
                                            <th className="py-3 text-right font-semibold text-white">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {adminRows.map((admin, index) => (
                                            <tr key={admin.id} className="group">
                                                <td className="py-4 pr-4 text-sm text-gray-500">{(admins.from ?? 1) + index}</td>
                                                <td className="py-4 pr-4 font-medium text-gray-900">{admin.name}</td>
                                                <td className="py-4 pr-4 text-gray-600">{admin.email}</td>
                                                <td className="py-4 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleClass(admin.role)}`}
                                                    >
                                                        {roleLabel(admin.role)}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-600">{new Date(admin.created_at).toLocaleDateString('en-GB')}</td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-[#00515F] hover:text-[#00353D]"
                                                            onClick={() => openEdit(admin)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <span className="inline-flex opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                                                        onClick={() => setDeleteId(admin.id)}
                                                                        title="Delete role"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Delete Role</DialogTitle>
                                                                        <DialogDescription>
                                                                            Are you sure you want to delete <strong>{admin.name}</strong>? This action
                                                                            cannot be undone.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" disabled={isDeleting}>
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            onClick={handleDelete}
                                                                            disabled={isDeleting}
                                                                            className="bg-red-600 text-white hover:bg-red-700"
                                                                        >
                                                                            {isDeleting && deleteId === admin.id ? 'Deleting...' : 'Delete'}
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {adminRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                                                    No roles found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="suppliers">
                    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900">Registered Suppliers</CardTitle>
                            <label className="relative block w-full sm:w-72">
                                <span className="sr-only">Search suppliers on this page</span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={supplierSearch}
                                    onChange={(event) => setSupplierSearch(event.target.value)}
                                    placeholder="Name, TIN, or email"
                                    className="focus:border-teal focus:ring-teal/15 h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-2"
                                />
                            </label>
                        </CardHeader>
                        <CardContent>
                    <div className="max-h-[calc(100vh-22rem)] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 z-10 bg-linear-to-r from-[#00515F] via-[#00353D] to-black">
                                        <tr className="border-b border-white/10">
                                            <th className="py-3 pr-4 font-semibold text-white">#</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Supplier</th>
                                            <th className="py-3 pr-4 font-semibold text-white">TIN</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Email</th>
                                            <th className="py-3 pr-4 font-semibold text-white">Status</th>
                                            <th className="py-3 font-semibold text-white">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {supplierRows.map((supplier, index) => (
                                            <tr key={supplier.id}>
                                                <td className="py-4 pr-4 text-sm text-gray-500">{(suppliers.from ?? 1) + index}</td>
                                                <td className="py-4 pr-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{supplier.legal_name}</p>
                                                        {supplier.trade_name && <p className="text-sm text-gray-500">{supplier.trade_name}</p>}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4 text-gray-600">{supplier.tin || '-'}</td>
                                                <td className="py-4 pr-4 text-gray-600">{supplier.primary_email || '-'}</td>
                                                <td className="py-4 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            supplier.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : supplier.status === 'rejected'
                                                                  ? 'bg-red-50 text-red-700'
                                                                  :                                                                   ['pending', 'under_review'].includes(supplier.status)
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {['pending', 'under_review'].includes(supplier.status)
                                                            ? 'Pending'
                                                            : supplier.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-600">{new Date(supplier.created_at).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                        {supplierRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                                                    No suppliers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
