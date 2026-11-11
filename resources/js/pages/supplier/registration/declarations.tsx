import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { FileCheck, ArrowLeft } from 'lucide-react';

export interface DeclarationsProps {
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

export default function Declarations({ step, supplier }: DeclarationsProps) {
    const { data, setData, post, processing } = useForm({
        declaration_confirmed: !!(supplier as Record<string, unknown>)?.declaration_confirmed,
    });

    const submitRegistration: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/submit');
    };

    const isStepValid = !!data.declaration_confirmed;

    const isFilled = (value: unknown): boolean => {
        return value !== '' && value !== null && value !== undefined && value !== false;
    };

    const sectionStatus = (): { status: 'complete' | 'partial' | 'not-started'; missingItems: string[] } => {
        if (isFilled(data.declaration_confirmed)) {
            return { status: 'complete', missingItems: [] };
        }

        return { status: 'not-started', missingItems: ['Declaration confirmation'] };
    };

    const declarationSection = sectionStatus();

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Declarations" />

            <form onSubmit={submitRegistration}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Declaration"
                        description="Please confirm the following before submitting your registration."
                        icon={<FileCheck className="h-5 w-5" />}
                        status={declarationSection.status}
                        missingItems={declarationSection.missingItems}
                    >
                        <div className="mt-6 space-y-6">
                            <div className="flex items-start gap-3">
                                <Checkbox id="declaration_confirmed" checked={!!data.declaration_confirmed} onCheckedChange={(checked) => setData('declaration_confirmed', !!checked)} className="mt-0.5" />
                                <Label htmlFor="declaration_confirmed" className="text-sm leading-relaxed text-gray-700">
                                    I confirm that the information provided is accurate, that the company is not debarred or blacklisted, and I agree to EEC supplier terms and conditions.
                                </Label>
                            </div>
                        </div>

                        <Card className="mt-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                            <CardContent className="p-4">
                                <p className="text-xs text-gray-500">
                                    By submitting this registration, you confirm that you have read and agree to the supplier terms and conditions.
                                    If a terms and conditions document exists, it will be linked here.
                                </p>
                            </CardContent>
                        </Card>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/documents" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                    <Button type="submit" disabled={processing || !isStepValid} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                </div>
            </form>
        </SupplierLayout>
    );
}
