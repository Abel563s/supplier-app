import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { CreditCard, Users, ShieldCheck, ArrowLeft } from 'lucide-react';

export interface BankFinancialProps {
    step: number;
    supplier: Record<string, unknown>;
    completion: {
        steps: Array<{ number: number; title: string; status: string; href: string }>;
        currentStep: number;
        completedSteps: number;
        totalSteps: number;
        percentage: number;
    };
}

interface RequiredField {
    key: string;
    label: string;
}

const requiredFieldsBySection: Record<string, RequiredField[]> = {
    banking: [
        { key: 'bank_name', label: 'Bank Name' },
        { key: 'branch_name', label: 'Branch Name' },
        { key: 'account_number', label: 'Account Number' },
        { key: 'account_holder_name', label: 'Account Holder Name' },
    ],
    capacity: [
        { key: 'number_of_employees', label: 'Number of Employees' },
        { key: 'technical_personnel', label: 'Technical Personnel' },
        { key: 'non_technical_personnel', label: 'Non-Technical Personnel' },
    ],
    authorization: [
        { key: 'subject_to_excise_tax', label: 'Subject to Excise Tax' },
        { key: 'authorized_manufacturer_distributor', label: 'Authorized Manufacturer / Distributor' },
    ],
};

export default function BankFinancial({ step, supplier }: BankFinancialProps) {
    const supplierRecord = (supplier ?? {}) as Record<string, string | boolean | null | undefined>;
    const supplierText = (key: string): string => {
        const value = supplierRecord[key];

        return typeof value === 'string' ? value : '';
    };
    const supplierBoolean = (key: string): boolean => supplierRecord[key] === true;

    const { data, setData, post, processing } = useForm({
        bank_name: supplierText('bank_name'),
        branch_name: supplierText('branch_name'),
        account_number: supplierText('account_number'),
        account_holder_name: supplierText('account_holder_name'),
        number_of_employees: supplierText('number_of_employees'),
        technical_personnel: supplierText('technical_personnel'),
        non_technical_personnel: supplierText('non_technical_personnel'),
        subject_to_excise_tax: supplierBoolean('subject_to_excise_tax'),
        authorized_manufacturer_distributor: supplierBoolean('authorized_manufacturer_distributor'),
    });

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/bank-financial', {
            onSuccess: () => {},
        });
    };

    const isFilled = (value: unknown): boolean => {
        return value !== '' && value !== null && value !== undefined && value !== false;
    };

    const sectionStatus = (section: string): { status: 'complete' | 'partial' | 'not-started'; missingItems: string[] } => {
        const requiredFields = requiredFieldsBySection[section] ?? [];
        const missingItems = requiredFields
            .filter((field) => !isFilled(data[field.key as keyof typeof data]))
            .map((field) => field.label);

        if (missingItems.length === requiredFields.length) {
            return { status: 'not-started', missingItems };
        }
        if (missingItems.length > 0) {
            return { status: 'partial', missingItems };
        }

        return { status: 'complete', missingItems: [] };
    };

    const bankingSection = sectionStatus('banking');
    const capacitySection = sectionStatus('capacity');
    const authorizationSection = sectionStatus('authorization');

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Bank & Financial" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Banking Information"
                        description="Provide your banking details."
                        icon={<CreditCard className="h-5 w-5" />}
                        status={bankingSection.status}
                        missingItems={bankingSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="bank_name" className="text-sm font-medium text-gray-700">Bank Name</Label>
                                <Input id="bank_name" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} className="mt-1.5 h-11" placeholder="Bank name" />
                            </div>

                            <div>
                                <Label htmlFor="branch_name" className="text-sm font-medium text-gray-700">Branch Name</Label>
                                <Input id="branch_name" value={data.branch_name} onChange={(e) => setData('branch_name', e.target.value)} className="mt-1.5 h-11" placeholder="Branch name" />
                            </div>

                            <div>
                                <Label htmlFor="account_number" className="text-sm font-medium text-gray-700">Account Number</Label>
                                <Input id="account_number" value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} className="mt-1.5 h-11" placeholder="Account number" />
                            </div>

                            <div>
                                <Label htmlFor="account_holder_name" className="text-sm font-medium text-gray-700">Account Holder Name</Label>
                                <Input id="account_holder_name" value={data.account_holder_name} onChange={(e) => setData('account_holder_name', e.target.value)} className="mt-1.5 h-11" placeholder="Account holder name" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Organization Capacity"
                        description="Provide information about your organization's capacity."
                        icon={<Users className="h-5 w-5" />}
                        status={capacitySection.status}
                        missingItems={capacitySection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="number_of_employees" className="text-sm font-medium text-gray-700">Number of Employees</Label>
                                <Input id="number_of_employees" type="number" value={data.number_of_employees} onChange={(e) => setData('number_of_employees', e.target.value)} className="mt-1.5 h-11" placeholder="0" />
                            </div>

                            <div>
                                <Label htmlFor="technical_personnel" className="text-sm font-medium text-gray-700">Technical Personnel</Label>
                                <Input id="technical_personnel" type="number" value={data.technical_personnel} onChange={(e) => setData('technical_personnel', e.target.value)} className="mt-1.5 h-11" placeholder="0" />
                            </div>

                            <div>
                                <Label htmlFor="non_technical_personnel" className="text-sm font-medium text-gray-700">Non-Technical Personnel</Label>
                                <Input id="non_technical_personnel" type="number" value={data.non_technical_personnel} onChange={(e) => setData('non_technical_personnel', e.target.value)} className="mt-1.5 h-11" placeholder="0" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Tax / Authorization"
                        description="Select any applicable tax or authorization options."
                        icon={<ShieldCheck className="h-5 w-5" />}
                        status={authorizationSection.status}
                        missingItems={authorizationSection.missingItems}
                    >
                        <div className="mt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Checkbox id="subject_to_excise_tax" checked={!!data.subject_to_excise_tax} onCheckedChange={(checked) => setData('subject_to_excise_tax', !!checked)} className="mt-0.5" />
                                <div className="grid gap-1">
                                    <Label htmlFor="subject_to_excise_tax" className="text-sm font-medium text-gray-700">Goods/services are subject to excise tax</Label>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox id="authorized_manufacturer_distributor" checked={!!data.authorized_manufacturer_distributor} onCheckedChange={(checked) => setData('authorized_manufacturer_distributor', !!checked)} className="mt-0.5" />
                                <div className="grid gap-1">
                                    <Label htmlFor="authorized_manufacturer_distributor" className="text-sm font-medium text-gray-700">Authorized manufacturer / distributor</Label>
                                </div>
                            </div>
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/business-scope" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <Button onClick={(e) => { e.preventDefault(); nextStep(e as unknown as React.FormEvent); }} disabled={processing} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </form>
        </SupplierLayout>
    );
}
