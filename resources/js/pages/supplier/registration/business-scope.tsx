import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { csrfHeaders } from '@/lib/csrf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Pencil, Tag, FileText, ArrowLeft } from 'lucide-react';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useState, useCallback } from 'react';
import InputError from '@/components/input-error';
import { primaryBusinessCategoryOptions, procurementTypeOptions, specializationOptions, subCategoryOptions } from '@/lib/registration-options';

export interface BusinessScopeProps {
    step: number;
    contracts: Array<{
        id: number;
        client_project_name: string;
        nature_similarity: string;
        contract_value: string;
        contract_date: string;
    }>;
}

interface RequiredField {
    key: string;
    label: string;
}

const requiredFieldsBySection: Record<string, RequiredField[]> = {
    procurement: [
        { key: 'procurement_type', label: 'Procurement Type' },
    ],
    classification: [
        { key: 'primary_business_category', label: 'Primary Business Category' },
        { key: 'sub_category', label: 'Sub-category' },
        { key: 'specialization', label: 'Specialization' },
        { key: 'products_services_description', label: 'Products / Services Description' },
    ],
};

export default function BusinessScope({ step, supplier, contracts = [] }: BusinessScopeProps & { supplier?: Record<string, unknown> }) {
    const supplierRecord = (supplier ?? {}) as Record<string, string | string[] | null | undefined>;
    const supplierText = (key: string): string => {
        const value = supplierRecord[key];

        return typeof value === 'string' ? value : '';
    };

    const storedProcurementTypes = Array.isArray(supplierRecord.procurement_type_list)
        ? supplierRecord.procurement_type_list
        : supplierText('procurement_type').split(',').filter(Boolean);

    const initialProcurementTypes = procurementTypeOptions
        .map((option) => option.value)
        .filter((value) => storedProcurementTypes.includes(value));

    const { data, setData, post, processing, errors } = useForm({
        procurement_type: initialProcurementTypes,
        primary_business_category: supplierText('primary_business_category'),
        sub_category: supplierText('sub_category'),
        specialization: supplierText('specialization'),
        products_services_description: supplierText('products_services_description'),
    });

    const toggleProcurementType = (value: string) => {
        const selected = (data.procurement_type as string[]) || [];
        const updated = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
        setData('procurement_type', updated);
    };

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/business-scope', {
            onSuccess: () => {},
        });
    };

    const requiredFields: Array<keyof typeof data> = ['primary_business_category', 'sub_category', 'specialization', 'products_services_description'];
    const isStepValid = requiredFields.every((field) => {
        const value = data[field];
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== '' && value !== null && value !== undefined;
    }) && ((data.procurement_type as string[]) || []).length > 0;

    const procurementTypeError = errors.procurement_type || (errors as Record<string, string>)['procurement_type.0'];

    const isFilled = (value: unknown): boolean => {
        return value !== '' && value !== null && value !== undefined && value !== false;
    };

    const sectionStatus = (section: string): { status: 'complete' | 'partial' | 'not-started'; missingItems: string[] } => {
        const requiredFields = requiredFieldsBySection[section] ?? [];
        const missingItems = requiredFields
            .filter((field) => {
                const val = data[field.key as keyof typeof data];
                if (field.key === 'procurement_type') {
                    return !isFilled(val) || ((val as string[]) || []).length === 0;
                }
                return !isFilled(val);
            })
            .map((field) => field.label);

        if (missingItems.length === requiredFields.length) {
            return { status: 'not-started', missingItems };
        }
        if (missingItems.length > 0) {
            return { status: 'partial', missingItems };
        }

        return { status: 'complete', missingItems: [] };
    };

    const procurementSection = sectionStatus('procurement');
    const classificationSection = sectionStatus('classification');

    const [isSubmittingContract, setIsSubmittingContract] = useState(false);
    const [editingContract, setEditingContract] = useState<{ id: number; client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string } | null>(null);
    const [localContracts, setLocalContracts] = useState<Array<{ id: number; client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }>>(contracts || []);

    const handleAddContract = useCallback(async (contractData: { client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }) => {
        setIsSubmittingContract(true);

        try {
            const response = await fetch('/supplier/registration/contracts', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    ...csrfHeaders(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(contractData),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Failed to add contract:', response.status, text);
                alert('Failed to add contract. Please try again.');
                return;
            }

            const newContract = await response.json();
            setLocalContracts((prev) => [...prev, newContract]);
        } catch (error) {
            console.error('Error adding contract:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmittingContract(false);
        }
    }, []);

    const handleUpdateContract = useCallback(async (contractData: { client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }) => {
        if (!editingContract) return;
        setIsSubmittingContract(true);

        try {
            const response = await fetch(`/supplier/registration/contracts/${editingContract.id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    ...csrfHeaders(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(contractData),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Failed to update contract:', response.status, text);
                alert(`Failed to update contract: ${response.status} - ${text}`);
                return;
            }

            const updatedContract = await response.json();
            setLocalContracts((prev) => prev.map((contract) => contract.id === updatedContract.id ? updatedContract : contract));
            setEditingContract(null);
        } catch (error) {
            console.error('Error updating contract:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmittingContract(false);
        }
    }, [editingContract]);

    const handleRemove = useCallback(async (contractId: number) => {
        try {
            const response = await fetch(`/supplier/registration/contracts/${contractId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: csrfHeaders(),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Failed to delete contract:', response.status, text);
                alert('Failed to delete contract. Please try again.');
                return;
            }

            setLocalContracts((prev) => prev.filter((contract) => contract.id !== contractId));
        } catch (error) {
            console.error('Error removing contract:', error);
            alert('An error occurred. Please try again.');
        }
    }, []);

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Business Scope & Categories" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Procurement Type"
                        description="Select all procurement types your organization provides."
                        icon={<Tag className="h-5 w-5" />}
                        status={procurementSection.status}
                        missingItems={procurementSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {procurementTypeOptions.map((option) => {
                                const selected = ((data.procurement_type as string[]) || []).includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => toggleProcurementType(option.value)}
                                        className={`rounded-xl border-2 p-4 text-center transition-all ${
                                            selected ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className={`text-sm font-medium ${selected ? 'text-teal' : 'text-gray-700'}`}>{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <InputError className="mt-3" message={procurementTypeError} />
                    </FormSectionCard>

                    <FormSectionCard
                        title="Business Classification"
                        description="Provide the primary category of your business."
                        icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 21V7L12 3L19 7V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        status={classificationSection.status}
                        missingItems={classificationSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="primary_business_category" className="text-sm font-medium text-gray-700 form-required">Primary Business Category</Label>
                                <Select value={data.primary_business_category} onValueChange={(value) => setData('primary_business_category', value)}>
                                    <SelectTrigger id="primary_business_category" className="mt-1.5 h-11">
                                        <SelectValue placeholder="Select primary business category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {primaryBusinessCategoryOptions.map((option) => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.primary_business_category} />
                            </div>

                            <div>
                                <Label htmlFor="sub_category" className="text-sm font-medium text-gray-700 form-required">Sub-category</Label>
                                <SearchableSelect
                                    id="sub_category"
                                    className="mt-1.5"
                                    value={data.sub_category}
                                    onChange={(value) => setData('sub_category', value)}
                                    options={subCategoryOptions}
                                    placeholder="Search or select sub-category"
                                    emptyMessage="No sub-category found."
                                />
                                <InputError className="mt-2" message={errors.sub_category} />
                            </div>

                            <div>
                                <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 form-required">Specialization</Label>
                                <SearchableSelect
                                    id="specialization"
                                    className="mt-1.5"
                                    value={data.specialization}
                                    onChange={(value) => setData('specialization', value)}
                                    options={specializationOptions}
                                    placeholder="Search or select specialization"
                                    emptyMessage="No specialization found."
                                />
                                <InputError className="mt-2" message={errors.specialization} />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Products / Services Description"
                        description="Describe the products or services your organization provides."
                        icon={<FileText className="h-5 w-5" />}
                        status={classificationSection.status}
                        missingItems={classificationSection.missingItems.filter((item) => item === 'Products / Services Description')}
                    >
                        <div className="mt-6">
                            <Label htmlFor="products_services_description" className="text-sm font-medium text-gray-700 form-required">Products / Services Description</Label>
                            <Textarea
                                id="products_services_description"
                                value={data.products_services_description}
                                onChange={(e) => setData('products_services_description', e.target.value)}
                                className="mt-1.5"
                                rows={4}
                                placeholder="Describe your products and services..."
                            />
                            <InputError className="mt-2" message={errors.products_services_description} />
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Similar Contracts & Experience"
                        description="List completed work similar in nature and complexity. This information may be used for supplier shortlisting."
                        icon={<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M9 12H15M12 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        status="complete"
                        missingItems={[]}
                    >
                        <div className="mt-6">
                            {(localContracts || []).length === 0 ? (
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-500">No similar contracts added</p>
                                    <AddContractDialog
                                        onSubmit={handleAddContract}
                                        isSubmitting={isSubmittingContract}
                                    />
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Client / Project</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nature / Similarity</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Value</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Date</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {localContracts.map((contract) => (
                                                    <tr key={contract.id} className="border-t border-gray-100">
                                                        <td className="px-4 py-3 text-gray-900">{contract.client_project_name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{contract.nature_similarity}</td>
                                                        <td className="px-4 py-3 text-right text-gray-900">{contract.contract_value}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">{contract.contract_date}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingContract(contract)}>
                                                                    <Pencil className="h-4 w-4 text-gray-600" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(contract.id)}>
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4">
                                        <AddContractDialog
                                            onSubmit={handleAddContract}
                                            isSubmitting={isSubmittingContract}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/contact" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <Button onClick={(e) => { e.preventDefault(); nextStep(e as unknown as React.FormEvent); }} disabled={processing || !isStepValid} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </form>

            {editingContract && (
                <EditContractDialog
                    contract={editingContract}
                    onSubmit={handleUpdateContract}
                    isSubmitting={isSubmittingContract}
                    onClose={() => setEditingContract(null)}
                />
            )}
        </SupplierLayout>
    );
}

function EditContractDialog({ contract, onSubmit, isSubmitting, onClose }: { contract: { id: number; client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }; onSubmit: (data: { client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }) => void; isSubmitting: boolean; onClose: () => void }) {
    const [form, setForm] = useState({
        client_project_name: contract.client_project_name,
        nature_similarity: contract.nature_similarity,
        contract_value: contract.contract_value,
        contract_date: contract.contract_date,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        await onSubmit(form);
        onClose();
    };

    return (
        <Dialog open={!!contract} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Similar Contract</DialogTitle>
                    <DialogDescription>Update the contract details below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="edit-client_project_name">Client / Project Name</Label>
                            <Input id="edit-client_project_name" className="mt-1.5 h-11" value={form.client_project_name} onChange={(e) => setForm({ ...form, client_project_name: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="edit-nature_similarity">Nature / Similarity</Label>
                            <Input id="edit-nature_similarity" className="mt-1.5 h-11" value={form.nature_similarity} onChange={(e) => setForm({ ...form, nature_similarity: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="edit-contract_value">Contract Value</Label>
                            <Input id="edit-contract_value" className="mt-1.5 h-11" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="edit-contract_date">Date</Label>
                            <Input id="edit-contract_date" type="date" className="mt-1.5 h-11" value={form.contract_date} onChange={(e) => setForm({ ...form, contract_date: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddContractDialog({ onSubmit, isSubmitting }: { onSubmit: (data: { client_project_name: string; nature_similarity: string; contract_value: string; contract_date: string }) => void; isSubmitting: boolean }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        client_project_name: '',
        nature_similarity: '',
        contract_value: '',
        contract_date: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        await onSubmit(form);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contract
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Similar Contract</DialogTitle>
                    <DialogDescription>Add a contract that is similar in nature and complexity to your work.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="client_project_name">Client / Project Name</Label>
                            <Input id="client_project_name" className="mt-1.5 h-11" value={form.client_project_name} onChange={(e) => setForm({ ...form, client_project_name: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="nature_similarity">Nature / Similarity</Label>
                            <Input id="nature_similarity" className="mt-1.5 h-11" value={form.nature_similarity} onChange={(e) => setForm({ ...form, nature_similarity: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="contract_value">Contract Value</Label>
                            <Input id="contract_value" className="mt-1.5 h-11" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="contract_date">Date</Label>
                            <Input id="contract_date" type="date" className="mt-1.5 h-11" value={form.contract_date} onChange={(e) => setForm({ ...form, contract_date: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Contract'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
