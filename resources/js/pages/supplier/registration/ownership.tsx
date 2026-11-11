import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { UserCheck, ArrowLeft } from 'lucide-react';

export interface OwnershipProps {
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
    ownership: [
        { key: 'signatory_title', label: 'Signatory Title' },
        { key: 'owner_ceo_name', label: 'Owner / CEO Name' },
    ],
};

export default function Ownership({ step, supplier }: OwnershipProps) {
    const supplierRecord = (supplier ?? {}) as Record<string, string | null | undefined>;
    const supplierText = (key: string): string => {
        const value = supplierRecord[key];

        return typeof value === 'string' ? value : '';
    };

    const { data, setData, post, processing } = useForm({
        signatory_title: supplierText('signatory_title'),
        owner_ceo_name: supplierText('owner_ceo_name'),
    });

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/ownership', {
            onSuccess: () => {},
        });
    };

    const requiredFields: Array<keyof typeof data> = ['signatory_title'];
    const isStepValid = requiredFields.every((field) => {
        const value = data[field];
        return value !== '' && value !== null && value !== undefined;
    });

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

    const ownershipSection = sectionStatus('ownership');

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Ownership & Signatory" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Authorized Signatory"
                        description="The person authorized to sign on behalf of the organization."
                        icon={<UserCheck className="h-5 w-5" />}
                        status={ownershipSection.status}
                        missingItems={ownershipSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="signatory_title" className="text-sm font-medium text-gray-700 form-required">Signatory Title</Label>
                                <Input id="signatory_title" value={data.signatory_title} onChange={(e) => setData('signatory_title', e.target.value)} className="mt-1.5 h-11" placeholder="e.g. Chief Executive Officer" />
                            </div>

                            <div>
                                <Label htmlFor="owner_ceo_name" className="text-sm font-medium text-gray-700">Owner / CEO Name</Label>
                                <Input id="owner_ceo_name" value={data.owner_ceo_name} onChange={(e) => setData('owner_ceo_name', e.target.value)} className="mt-1.5 h-11" placeholder="Full name" />
                            </div>
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/bank-financial" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <Button onClick={(e) => { e.preventDefault(); nextStep(e as unknown as React.FormEvent); }} disabled={processing || !isStepValid} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </form>
        </SupplierLayout>
    );
}
