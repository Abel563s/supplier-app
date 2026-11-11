import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Receipt } from 'lucide-react';
import { countryOfRegistrationOptions, legalFormOptions } from '@/lib/registration-options';

const otherCountryValue = 'other';
const otherLegalFormValue = 'other';

interface LegalEntityProps {
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
    legal: [
        { key: 'legal_form', label: 'Legal Form' },
        { key: 'country_of_registration', label: 'Country of Registration' },
        { key: 'legal_name', label: 'Company / Legal Name' },
        { key: 'tin', label: 'Tax Identification Number (TIN)' },
    ],
    registration: [
        { key: 'business_registration_no', label: 'Business Registration No.' },
        { key: 'trade_license_renewed_date', label: 'Trade License Renewed Date' },
    ],
    company: [
        { key: 'registered_capital', label: 'Registered Capital (ETB)' },
        { key: 'latest_annual_turnover', label: 'Latest Annual Turnover (ETB)' },
        { key: 'date_established', label: 'Date Established' },
    ],
    tax: [
        { key: 'tax_clearance_from', label: 'Tax Clearance From' },
        { key: 'tax_clearance_to', label: 'Tax Clearance To' },
    ],
};

export default function LegalEntity({ step, supplier, completion }: LegalEntityProps) {
    const supplierRecord = (supplier ?? {}) as Record<string, string | boolean | null | undefined>;
    const supplierText = (key: string): string => {
        const value = supplierRecord[key];

        return typeof value === 'string' ? value : '';
    };
    const supplierBoolean = (key: string): boolean => supplierRecord[key] === true;

    const initialCountry = supplierText('country_of_registration');
    const initialCountryIsListed = initialCountry === '' || countryOfRegistrationOptions.includes(initialCountry);
    const initialLegalForm = supplierText('legal_form');
    const initialLegalFormIsListed = initialLegalForm === '' || legalFormOptions.includes(initialLegalForm);

    const { data, setData, post, processing, errors } = useForm({
        legal_form: supplierText('legal_form'),
        country_of_registration: initialCountry,
        legal_name: supplierText('legal_name'),
        trade_name: supplierText('trade_name'),
        tin: supplierText('tin'),
        business_registration_no: supplierText('business_registration_no'),
        vat_registered: supplierBoolean('vat_registered'),
        vat_registration_no: supplierText('vat_registration_no'),
        registered_capital: supplierText('registered_capital'),
        latest_annual_turnover: supplierText('latest_annual_turnover'),
        date_established: supplierText('date_established'),
        trade_license_renewed_date: supplierText('trade_license_renewed_date'),
        tax_clearance_from: supplierText('tax_clearance_from'),
        tax_clearance_to: supplierText('tax_clearance_to'),
        tax_clearance_fiscal_year: supplierText('tax_clearance_fiscal_year'),
    });

    const [isOtherCountry, setIsOtherCountry] = useState(!initialCountryIsListed);
    const [isOtherLegalForm, setIsOtherLegalForm] = useState(!initialLegalFormIsListed);

    const nextStep: FormEventHandler = (e) => {
        e.preventDefault();
        post('/supplier/registration/legal-entity', {
            onSuccess: () => {},
        });
    };

    const requiredFields: Array<keyof typeof data> = ['legal_form', 'country_of_registration', 'legal_name', 'tin', 'business_registration_no', 'registered_capital', 'latest_annual_turnover', 'date_established', 'trade_license_renewed_date', 'tax_clearance_from', 'tax_clearance_to'];
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

    const legalSection = sectionStatus('legal');
    const registrationSection = sectionStatus('registration');
    const companySection = sectionStatus('company');
    const taxSection = sectionStatus('tax');

    return (
        <SupplierLayout currentStep={step}>
            <Head title="Legal Entity & Identification" />

            <form onSubmit={nextStep}>
                <div className="space-y-6">
                    <FormSectionCard
                        title="Legal Information"
                        description="Provide the legal and registration details of your organization."
                        icon={<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal"><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                        status={legalSection.status}
                        missingItems={legalSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="legal_form" className="text-sm font-medium text-gray-700 form-required">Legal Form</Label>
                                <Select
                                    value={isOtherLegalForm ? otherLegalFormValue : data.legal_form}
                                    onValueChange={(value) => {
                                        if (value === otherLegalFormValue) {
                                            setIsOtherLegalForm(true);
                                            setData('legal_form', '');

                                            return;
                                        }

                                        setIsOtherLegalForm(false);
                                        setData('legal_form', value);
                                    }}
                                >
                                    <SelectTrigger id="legal_form" className="mt-1.5 h-11">
                                        <SelectValue placeholder="Select legal form" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {legalFormOptions.map((option) => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                        <SelectItem value={otherLegalFormValue}>Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.legal_form as string} className="mt-2" />
                                {isOtherLegalForm && (
                                    <Input
                                        id="other_legal_form"
                                        value={data.legal_form}
                                        onChange={(e) => setData('legal_form', e.target.value)}
                                        className="mt-1.5 h-11"
                                        placeholder="Enter legal form"
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div>
                                <Label htmlFor="country_of_registration" className="text-sm font-medium text-gray-700 form-required">Country of Registration</Label>
                                <Select
                                    value={isOtherCountry ? otherCountryValue : data.country_of_registration}
                                    onValueChange={(value) => {
                                        if (value === otherCountryValue) {
                                            setIsOtherCountry(true);
                                            setData('country_of_registration', '');

                                            return;
                                        }

                                        setIsOtherCountry(false);
                                        setData('country_of_registration', value);
                                    }}
                                >
                                    <SelectTrigger id="country_of_registration" className="mt-1.5 h-11">
                                        <SelectValue placeholder="Select country of registration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryOfRegistrationOptions.map((option) => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                        <SelectItem value={otherCountryValue}>Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.country_of_registration as string} className="mt-2" />
                                {isOtherCountry && (
                                    <Input
                                        id="other_country_of_registration"
                                        value={data.country_of_registration}
                                        onChange={(e) => setData('country_of_registration', e.target.value)}
                                        className="mt-1.5 h-11"
                                        placeholder="Enter country of registration"
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div className="md:col-span-1">
                                <Label htmlFor="legal_name" className="text-sm font-medium text-gray-700 form-required">Company / Legal Name</Label>
                                <Input id="legal_name" value={data.legal_name} onChange={(e) => setData('legal_name', e.target.value)} className="mt-1.5 h-11" placeholder="Official registered company name" />
                                <InputError message={errors.legal_name as string} className="mt-2" />
                            </div>

                            <div className="md:col-span-1">
                                <Label htmlFor="trade_name" className="text-sm font-medium text-gray-700">Trade Name</Label>
                                <Input id="trade_name" value={data.trade_name} onChange={(e) => setData('trade_name', e.target.value)} className="mt-1.5 h-11" placeholder="Trading name if different from legal name" />
                                <InputError message={errors.trade_name as string} className="mt-2" />
                                <p className="mt-1.5 text-xs text-gray-500">Complete this only if your trading name differs from the legal company name.</p>
                            </div>
                            <div className="md:col-span-1">
                                <Label htmlFor="tin" className="text-sm font-medium text-gray-700 form-required">Tax Identification Number (TIN)</Label>
                                <Input id="tin" value={data.tin} onChange={(e) => setData('tin', e.target.value)} className="mt-1.5 h-11" placeholder="Tax Identification Number" />
                                <InputError message={errors.tin as string} className="mt-2" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Registration Information"
                        description="Tax and business registration details."
                        icon={<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal"><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M9 12H15M12 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg></div>}
                        status={registrationSection.status}
                        missingItems={registrationSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="business_registration_no" className="text-sm font-medium text-gray-700 form-required">Business Registration No.</Label>
                                <Input id="business_registration_no" value={data.business_registration_no} onChange={(e) => setData('business_registration_no', e.target.value)} className="mt-1.5 h-11" placeholder="Business registration number" />
                                <InputError message={errors.business_registration_no as string} className="mt-2" />
                            </div>

                            <div className="md:col-span-1">
                                <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <Checkbox id="vat_registered" checked={data.vat_registered} onCheckedChange={(checked) => setData('vat_registered', !!checked)} className="mt-0.5" />
                                    <div className="grid gap-1">
                                        <Label htmlFor="vat_registered" className="text-sm font-medium text-gray-700">VAT Registered</Label>
                                        <p className="text-xs text-gray-500">Check if the company is VAT registered.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <Label htmlFor="vat_registration_no" className="text-sm font-medium text-gray-700">VAT Registration No.</Label>
                                <Input id="vat_registration_no" value={data.vat_registration_no} onChange={(e) => setData('vat_registration_no', e.target.value)} className="mt-1.5 h-11" placeholder="VAT registration number" />
                                <InputError message={errors.vat_registration_no as string} className="mt-2" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Company Information"
                        description="Registration and capital details."
                        icon={<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal"><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 21V7L12 3L19 7V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                        status={companySection.status}
                        missingItems={companySection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="registered_capital" className="text-sm font-medium text-gray-700 form-required">Registered Capital (ETB)</Label>
                                <Input id="registered_capital" type="number" value={data.registered_capital} onChange={(e) => setData('registered_capital', e.target.value)} className="mt-1.5 h-11" placeholder="0.00" />
                                <InputError message={errors.registered_capital as string} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="latest_annual_turnover" className="text-sm font-medium text-gray-700 form-required">Latest Annual Turnover (ETB)</Label>
                                <Input id="latest_annual_turnover" type="number" value={data.latest_annual_turnover} onChange={(e) => setData('latest_annual_turnover', e.target.value)} className="mt-1.5 h-11" placeholder="0.00" />
                                <InputError message={errors.latest_annual_turnover as string} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="date_established" className="text-sm font-medium text-gray-700 form-required">Date Established</Label>
                                <Input id="date_established" type="date" value={data.date_established} onChange={(e) => setData('date_established', e.target.value)} className="mt-1.5 h-11" />
                                <InputError message={errors.date_established as string} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="trade_license_renewed_date" className="text-sm font-medium text-gray-700 form-required">Trade License Renewed Date</Label>
                                <Input id="trade_license_renewed_date" type="date" value={data.trade_license_renewed_date} onChange={(e) => setData('trade_license_renewed_date', e.target.value)} className="mt-1.5 h-11" />
                                <InputError message={errors.trade_license_renewed_date as string} className="mt-2" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        title="Tax Information"
                        description="Provide your tax clearance details."
                        icon={<Receipt className="h-5 w-5" />}
                        status={taxSection.status}
                        missingItems={taxSection.missingItems}
                    >
                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="tax_clearance_from" className="text-sm font-medium text-gray-700 form-required">Tax Clearance From</Label>
                                <Input id="tax_clearance_from" type="date" value={data.tax_clearance_from} onChange={(e) => setData('tax_clearance_from', e.target.value)} className="mt-1.5 h-11" />
                                <InputError message={errors.tax_clearance_from as string} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="tax_clearance_to" className="text-sm font-medium text-gray-700 form-required">Tax Clearance To</Label>
                                <Input id="tax_clearance_to" type="date" value={data.tax_clearance_to} onChange={(e) => setData('tax_clearance_to', e.target.value)} className="mt-1.5 h-11" />
                                <InputError message={errors.tax_clearance_to as string} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="tax_clearance_fiscal_year" className="text-sm font-medium text-gray-700">Tax Clearance Fiscal Year</Label>
                                <Input id="tax_clearance_fiscal_year" value={data.tax_clearance_fiscal_year} onChange={(e) => setData('tax_clearance_fiscal_year', e.target.value)} className="mt-1.5 h-11" placeholder="e.g. 2025/2026" />
                                <InputError message={errors.tax_clearance_fiscal_year as string} className="mt-2" />
                            </div>
                        </div>
                    </FormSectionCard>
                </div>

                <div className="flex items-center justify-center border-t border-gray-200 pt-6">
                    <Button onClick={(e) => { e.preventDefault(); nextStep(e as unknown as React.FormEvent); }} disabled={processing || !isStepValid} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {processing ? 'Saving...' : 'Continue'}
                    </Button>
                </div>
            </form>
        </SupplierLayout>
    );
}
