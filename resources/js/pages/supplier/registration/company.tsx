import { Head, useForm } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSection from '@/components/supplier/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompanyForm {
    legal_name: string;
    trade_name: string;
    registration_number: string;
    tax_id: string;
    business_type: string;
    year_established: string;
}

export default function CompanyRegistration() {
    const { data, setData, post, processing, errors } = useForm<CompanyForm>({
        legal_name: '',
        trade_name: '',
        registration_number: '',
        tax_id: '',
        business_type: '',
        year_established: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/supplier/registration/company');
    };

    return (
        <SupplierLayout currentStep={1}>
            <Head title="Company Information" />

            <form onSubmit={submit}>
                <FormSection
                    title="Company Information"
                    description="Tell us about your organization."
                    helpText="Provide the legal and registered information exactly as it appears on your business documents."
                    onBack="/supplier"
                    onSubmit={submit}
                    submitLabel="Continue"
                    isSubmitting={processing}
                    showSaveDraft={true}
                    lastSaved="Today at 9:42 AM"
                >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Label htmlFor="legal_name">Company Legal Name *</Label>
                            <Input
                                id="legal_name"
                                value={data.legal_name}
                                onChange={(e) => setData('legal_name', e.target.value)}
                                placeholder="Enter your registered company name"
                                className="mt-1.5"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Official name as shown on your business license.</p>
                            {errors.legal_name && <p className="mt-1 text-xs text-red-600">{errors.legal_name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="trade_name">Trade Name</Label>
                            <Input
                                id="trade_name"
                                value={data.trade_name}
                                onChange={(e) => setData('trade_name', e.target.value)}
                                placeholder="Doing business as"
                                className="mt-1.5"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Leave blank if same as legal name.</p>
                            {errors.trade_name && <p className="mt-1 text-xs text-red-600">{errors.trade_name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="registration_number">Registration Number *</Label>
                            <Input
                                id="registration_number"
                                value={data.registration_number}
                                onChange={(e) => setData('registration_number', e.target.value)}
                                placeholder="Business registration number"
                                className="mt-1.5"
                            />
                            {errors.registration_number && <p className="mt-1 text-xs text-red-600">{errors.registration_number}</p>}
                        </div>

                        <div>
                            <Label htmlFor="tax_id">Tax Identification Number *</Label>
                            <Input
                                id="tax_id"
                                value={data.tax_id}
                                onChange={(e) => setData('tax_id', e.target.value)}
                                placeholder="TIN"
                                className="mt-1.5"
                            />
                            {errors.tax_id && <p className="mt-1 text-xs text-red-600">{errors.tax_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="business_type">Business Type *</Label>
                            <Input
                                id="business_type"
                                value={data.business_type}
                                onChange={(e) => setData('business_type', e.target.value)}
                                placeholder="e.g. Private Limited Company"
                                className="mt-1.5"
                            />
                            {errors.business_type && <p className="mt-1 text-xs text-red-600">{errors.business_type}</p>}
                        </div>

                        <div>
                            <Label htmlFor="year_established">Year Established *</Label>
                            <Input
                                id="year_established"
                                type="number"
                                value={data.year_established}
                                onChange={(e) => setData('year_established', e.target.value)}
                                placeholder="e.g. 2010"
                                className="mt-1.5"
                            />
                            {errors.year_established && <p className="mt-1 text-xs text-red-600">{errors.year_established}</p>}
                        </div>
                    </div>
                </FormSection>
            </form>
        </SupplierLayout>
    );
}
