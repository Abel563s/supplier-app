import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ArrowLeft, User, MapPin } from 'lucide-react';

interface ContactProps {
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
    contact: [
        { key: 'primary_contact_name', label: 'Primary Contact — Full Name' },
        { key: 'primary_phone', label: 'License Contact Number' },
        { key: 'alternate_phone', label: 'Alternate / Sales Contact Number' },
        { key: 'primary_email', label: 'Email' },
    ],
    location: [
        { key: 'city', label: 'City' },
        { key: 'subcity', label: 'Subcity' },
        { key: 'woreda', label: 'Woreda' },
    ],
};

export default function Contact({ step, supplier }: ContactProps) {
    const supplierRecord = (supplier ?? {}) as Record<string, string | null | undefined>;
    const supplierText = (key: string): string => {
        const value = supplierRecord[key];

        return typeof value === 'string' ? value : '';
    };

    const { data, setData, post, processing } = useForm({
        primary_contact_name: supplierText('primary_contact_name'),
        primary_phone: supplierText('primary_phone'),
        alternate_phone: supplierText('alternate_phone'),
        primary_email: supplierText('primary_email'),
        alternate_email: supplierText('alternate_email'),
        city: supplierText('city'),
        subcity: supplierText('subcity'),
        woreda: supplierText('woreda'),
    });

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/contact', {
            onSuccess: () => {},
        });
    };

    const requiredFields: Array<keyof typeof data> = ['primary_contact_name', 'primary_phone', 'alternate_phone', 'primary_email', 'city', 'subcity', 'woreda'];
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

    const contactSection = sectionStatus('contact');
    const locationSection = sectionStatus('location');

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Contact & Location" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Primary Contact"
                        description="The main point of contact for this registration."
                        icon={<User className="h-5 w-5" />}
                        status={contactSection.status}
                        missingItems={contactSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="primary_contact_name" className="text-sm font-medium text-gray-700 form-required">Primary Contact — Full Name</Label>
                                <Input id="primary_contact_name" value={data.primary_contact_name} onChange={(e) => setData('primary_contact_name', e.target.value)} className="mt-1.5 h-11" placeholder="Full name" />
                            </div>

                            <div>
                                <Label htmlFor="primary_phone" className="text-sm font-medium text-gray-700 form-required">License Contact Number</Label>
                                <Input id="primary_phone" type="tel" value={data.primary_phone} onChange={(e) => setData('primary_phone', e.target.value)} className="mt-1.5 h-11" placeholder="+251 911 234 567" />
                            </div>

                            <div>
                                <Label htmlFor="alternate_phone" className="text-sm font-medium text-gray-700 form-required">Alternate / Sales Contact Number</Label>
                                <Input id="alternate_phone" type="tel" value={data.alternate_phone} onChange={(e) => setData('alternate_phone', e.target.value)} className="mt-1.5 h-11" placeholder="Alternate number" />
                            </div>

                            <div>
                                <Label htmlFor="primary_email" className="text-sm font-medium text-gray-700 form-required">Email</Label>
                                <Input id="primary_email" type="email" value={data.primary_email} onChange={(e) => setData('primary_email', e.target.value)} className="mt-1.5 h-11" placeholder="contact@example.com" />
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="alternate_email" className="text-sm font-medium text-gray-700">Alternate Email</Label>
                                <Input id="alternate_email" type="email" value={data.alternate_email} onChange={(e) => setData('alternate_email', e.target.value)} className="mt-1.5 h-11" placeholder="alternate@example.com" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Location"
                        description="Your company's registered business location."
                        icon={<MapPin className="h-5 w-5" />}
                        status={locationSection.status}
                        missingItems={locationSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="city" className="text-sm font-medium text-gray-700 form-required">City</Label>
                                <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} className="mt-1.5 h-11" placeholder="City" />
                            </div>

                            <div>
                                <Label htmlFor="subcity" className="text-sm font-medium text-gray-700 form-required">Subcity</Label>
                                <Input id="subcity" value={data.subcity} onChange={(e) => setData('subcity', e.target.value)} className="mt-1.5 h-11" placeholder="Subcity" />
                            </div>

                            <div>
                                <Label htmlFor="woreda" className="text-sm font-medium text-gray-700 form-required">Woreda</Label>
                                <Input id="woreda" value={data.woreda} onChange={(e) => setData('woreda', e.target.value)} className="mt-1.5 h-11" placeholder="Woreda" />
                            </div>
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <Link href="/supplier/registration/legal-entity" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal">
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
