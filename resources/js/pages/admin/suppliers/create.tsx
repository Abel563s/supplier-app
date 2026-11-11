import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CreditCard, FileCheck2, Info, MapPin, Receipt, ShieldCheck, Tag, User, UserPlus } from 'lucide-react';

import AdminLayout from '@/layouts/admin/admin-layout';
import FormSectionCard from '@/components/admin/form-section-card';
import RegistrationStepper from '@/components/supplier/registration-stepper';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import {
    countryOfRegistrationOptions,
    legalFormOptions,
    primaryBusinessCategoryOptions,
    procurementTypeOptions,
    specializationOptions,
    subCategoryOptions,
} from '@/lib/registration-options';

interface SupplierCreateProps {
    completion: {
        steps: Array<{ number: number; title: string; status: string; href: string; metadata?: string }>;
        percentage: number;
        completedSteps: number;
        totalSteps: number;
    };
    documentTypes: Array<{ key: string; label: string; required: boolean }>;
}

const otherCountryValue = 'other';
const otherLegalFormValue = 'other';
const totalStepCount = 7;

interface RequiredField {
    key: string;
    label: string;
}

const requiredFieldsBySection: Record<string, RequiredField[]> = {
    legal: [
        { key: 'legal_form', label: 'Legal Form' },
        { key: 'country_of_registration', label: 'Country of Registration' },
        { key: 'legal_name', label: 'Company / Legal Name' },
        { key: 'tin', label: 'TIN' },
    ],
    registration: [
        { key: 'business_registration_no', label: 'Business Registration No.' },
        { key: 'registered_capital', label: 'Registered Capital' },
        { key: 'latest_annual_turnover', label: 'Latest Annual Turnover' },
        { key: 'trade_license_renewed_date', label: 'Trade License Renewed Date' },
    ],
    tax: [
        { key: 'tax_clearance_from', label: 'Tax Clearance From' },
        { key: 'tax_clearance_to', label: 'Tax Clearance To' },
    ],
    contact: [
        { key: 'primary_contact_name', label: 'Primary Contact' },
        { key: 'primary_phone', label: 'License Contact Number' },
        { key: 'alternate_phone', label: 'Alternate / Sales Contact Number' },
        { key: 'primary_email', label: 'Email' },
        { key: 'city', label: 'City' },
        { key: 'subcity', label: 'Subcity' },
        { key: 'woreda', label: 'Woreda' },
    ],
    business: [
        { key: 'procurement_type', label: 'Procurement Type' },
        { key: 'primary_business_category', label: 'Primary Business Category' },
        { key: 'sub_category', label: 'Sub-category' },
        { key: 'specialization', label: 'Specialization' },
    ],
    ownership: [
        { key: 'owner_ceo_name', label: 'Owner / CEO Name' },
        { key: 'signatory_title', label: 'Signatory Title' },
    ],
};

const optionalFinancialFields = [
    'bank_name',
    'branch_name',
    'account_number',
    'account_holder_name',
    'number_of_employees',
    'technical_personnel',
    'non_technical_personnel',
    'tax_clearance_from',
    'tax_clearance_to',
    'tax_clearance_fiscal_year',
];

const emptySupplier = {
    legal_form: '',
    country_of_registration: '',
    legal_name: '',
    trade_name: '',
    tin: '',
    business_registration_no: '',
    vat_registered: false as boolean,
    vat_registration_no: '',
    registered_capital: '',
    latest_annual_turnover: '',
    date_established: '',
    trade_license_renewed_date: '',
    primary_contact_name: '',
    primary_phone: '',
    alternate_phone: '',
    primary_email: '',
    alternate_email: '',
    city: '',
    subcity: '',
    woreda: '',
    procurement_type: [] as string[],
    primary_business_category: '',
    sub_category: '',
    specialization: '',
    products_services_description: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    account_holder_name: '',
    number_of_employees: '',
    technical_personnel: '',
    non_technical_personnel: '',
    tax_clearance_from: '',
    tax_clearance_to: '',
    tax_clearance_fiscal_year: '',
    subject_to_excise_tax: false as boolean,
    authorized_manufacturer_distributor: false as boolean,
    signatory_title: '',
    owner_ceo_name: '',
    declaration_confirmed: false as boolean,
};

export default function SupplierCreate({ completion, documentTypes }: SupplierCreateProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isOtherCountry, setIsOtherCountry] = useState(false);
    const [isOtherLegalForm, setIsOtherLegalForm] = useState(false);

    const { data, setData, post, processing, errors } = useForm(emptySupplier);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/suppliers');
    };

    const toggleProcurementType = (value: string) => {
        const selected = (data.procurement_type as string[]) || [];
        const updated = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
        setData('procurement_type', updated);
    };

    const goToStep = (step: number) => {
        setCurrentStep(Math.min(totalStepCount, Math.max(1, step)));
    };

    const procurementTypeError = errors.procurement_type || (errors as Record<string, string>)['procurement_type.0'];

    const steps = useMemo(
        () =>
            completion.steps.map((step) => ({
                ...step,
                shortTitle: step.title.split(' ').slice(0, 2).join(' '),
                status: step.status as 'complete' | 'partial' | 'needs-attention' | 'not-started' | 'optional',
                href: `#step-${step.number}`,
            })),
        [completion.steps],
    );

    const isFilled = (value: unknown): boolean => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        return value !== '' && value !== null && value !== undefined && value !== false;
    };

    const sectionStatus = (section: string): { status: 'complete' | 'partial' | 'not-started'; missingItems: string[] } => {
        if (section === 'financial') {
            const filledCount = optionalFinancialFields.filter((field) => isFilled(data[field as keyof typeof data])).length;

            return { status: filledCount > 0 ? 'complete' : 'not-started', missingItems: [] };
        }

        if (section === 'documents') {
            const missingDocuments = documentTypes.filter((documentType) => documentType.required).map((documentType) => documentType.label);

            return {
                status: 'not-started',
                missingItems: missingDocuments,
            };
        }

        if (section === 'declaration') {
            return { status: data.declaration_confirmed ? 'complete' : 'not-started', missingItems: [] };
        }

        const requiredFields = requiredFieldsBySection[section] ?? [];
        const missingItems = requiredFields
            .filter((field) => ! isFilled(data[field.key as keyof typeof data]))
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
    const taxSection = sectionStatus('tax');
    const contactSection = sectionStatus('contact');
    const businessSection = sectionStatus('business');
    const financialSection = sectionStatus('financial');
    const ownershipSection = sectionStatus('ownership');
    const documentsSection = sectionStatus('documents');
    const declarationSection = sectionStatus('declaration');

    const currentStepTitle = completion.steps.find((step) => step.number === currentStep)?.title ?? 'Register Supplier';

    return (
        <AdminLayout>
            <Head title={`Register Supplier - ${currentStepTitle}`} />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-[28px] font-bold text-gray-900">Register New Supplier</h1>
                    <p className="mt-2 text-base text-gray-600">
                        Complete the registration on behalf of a supplier. A supplier account is created from the email address provided.
                    </p>
                </div>
                <div className="rounded-xl border border-teal/20 bg-teal/5 px-5 py-3 text-right">
                    <p className="text-sm font-medium text-teal">Registration Progress</p>
                    <p className="text-xl font-bold text-gray-900">{completion.percentage}%</p>
                    <p className="text-xs text-gray-600">
                        Step {completion.completedSteps} of {completion.totalSteps} complete
                    </p>
                </div>
            </div>

            <div className="mb-10 flex justify-center transition-transform duration-300 hover:-translate-y-0.5">
                <div className="rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                    <RegistrationStepper steps={steps} currentStep={currentStep} onSelectStep={goToStep} mode="navigation" />
                    <p className="mt-2 text-center text-xs text-gray-500">Select any step to complete it, then save the registration.</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/suppliers"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal"
                    >
                        Back to suppliers
                    </Link>
                    <span className="text-sm text-gray-500">
                        Step {currentStep} of {totalStepCount} — {currentStepTitle}
                    </span>
                </div>

                <Separator className="bg-gray-200" />

                <div className="space-y-6">
                    {currentStep === 1 && (
                        <>
                            <FormSectionCard
                                title="Legal Entity & Identification"
                                description="Provide the legal and registration information of your organization."
                                icon={<Building2 className="h-5 w-5" />}
                                status={legalSection.status}
                                missingItems={legalSection.missingItems}
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                        {isOtherLegalForm && (
                                            <Input
                                                id="other_legal_form"
                                                value={data.legal_form}
                                                onChange={(e) => setData('legal_form', e.target.value)}
                                                className="mt-1.5 h-11"
                                                placeholder="Enter legal form"
                                            />
                                        )}
                                        <InputError className="mt-2" message={errors.legal_form} />
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
                                        {isOtherCountry && (
                                            <Input
                                                id="other_country_of_registration"
                                                value={data.country_of_registration}
                                                onChange={(e) => setData('country_of_registration', e.target.value)}
                                                className="mt-1.5 h-11"
                                                placeholder="Enter country of registration"
                                            />
                                        )}
                                        <InputError className="mt-2" message={errors.country_of_registration} />
                                    </div>

                                    <div>
                                        <Label htmlFor="legal_name" className="text-sm font-medium text-gray-700 form-required">Company / Legal Name</Label>
                                        <Input id="legal_name" value={data.legal_name} onChange={(e) => setData('legal_name', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.legal_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="tin" className="text-sm font-medium text-gray-700 form-required">TIN</Label>
                                        <Input id="tin" value={data.tin} onChange={(e) => setData('tin', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.tin} />
                                    </div>

                                    <div>
                                        <Label htmlFor="trade_name" className="text-sm font-medium text-gray-700">Trade Name</Label>
                                        <Input id="trade_name" value={data.trade_name} onChange={(e) => setData('trade_name', e.target.value)} className="mt-1.5 h-11" />
                                    </div>
                                </div>
                            </FormSectionCard>

                            <FormSectionCard
                                title="Registration Information"
                                description="Tax and business registration details."
                                icon={<FileCheck2 className="h-5 w-5" />}
                                status={registrationSection.status}
                                missingItems={registrationSection.missingItems}
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="business_registration_no" className="text-sm font-medium text-gray-700 form-required">Business Registration No.</Label>
                                        <Input id="business_registration_no" value={data.business_registration_no} onChange={(e) => setData('business_registration_no', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.business_registration_no} />
                                    </div>

                                    <div>
                                        <Label htmlFor="vat_registration_no" className="text-sm font-medium text-gray-700">VAT Registration No.</Label>
                                        <Input id="vat_registration_no" value={data.vat_registration_no} onChange={(e) => setData('vat_registration_no', e.target.value)} className="mt-1.5 h-11" />
                                    </div>

                                    <div>
                                        <Label htmlFor="registered_capital" className="text-sm font-medium text-gray-700 form-required">Registered Capital (ETB)</Label>
                                        <Input id="registered_capital" type="number" value={data.registered_capital} onChange={(e) => setData('registered_capital', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.registered_capital} />
                                    </div>

                                    <div>
                                        <Label htmlFor="latest_annual_turnover" className="text-sm font-medium text-gray-700 form-required">Latest Annual Turnover (ETB)</Label>
                                        <Input id="latest_annual_turnover" type="number" value={data.latest_annual_turnover} onChange={(e) => setData('latest_annual_turnover', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.latest_annual_turnover} />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_established" className="text-sm font-medium text-gray-700 form-required">Date Established</Label>
                                        <Input id="date_established" type="date" value={data.date_established} onChange={(e) => setData('date_established', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.date_established} />
                                    </div>

                                    <div>
                                        <Label htmlFor="trade_license_renewed_date" className="text-sm font-medium text-gray-700 form-required">Trade License Renewed Date</Label>
                                        <Input id="trade_license_renewed_date" type="date" value={data.trade_license_renewed_date} onChange={(e) => setData('trade_license_renewed_date', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.trade_license_renewed_date} />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Checkbox id="vat_registered" checked={data.vat_registered} onCheckedChange={(checked) => setData('vat_registered', !!checked)} />
                                        <Label htmlFor="vat_registered" className="text-sm font-medium text-gray-700">VAT Registered</Label>
                                    </div>
                                </div>
                            </FormSectionCard>

                            <FormSectionCard
                                title="Tax Information"
                                description="Provide the tax clearance validity details."
                                icon={<Receipt className="h-5 w-5" />}
                                status={taxSection.status}
                                missingItems={taxSection.missingItems}
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="tax_clearance_from" className="text-sm font-medium text-gray-700 form-required">Tax Clearance From</Label>
                                        <Input id="tax_clearance_from" type="date" value={data.tax_clearance_from} onChange={(e) => setData('tax_clearance_from', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.tax_clearance_from} />
                                    </div>

                                    <div>
                                        <Label htmlFor="tax_clearance_to" className="text-sm font-medium text-gray-700 form-required">Tax Clearance To</Label>
                                        <Input id="tax_clearance_to" type="date" value={data.tax_clearance_to} onChange={(e) => setData('tax_clearance_to', e.target.value)} className="mt-1.5 h-11" />
                                        <InputError className="mt-2" message={errors.tax_clearance_to} />
                                    </div>
                                </div>
                            </FormSectionCard>
                        </>
                    )}

                    {currentStep === 2 && (
                        <FormSectionCard
                            title="Contact & Location"
                            description="Provide the primary contact details and registered business location."
                            icon={<User className="h-5 w-5" />}
                            status={contactSection.status}
                            missingItems={contactSection.missingItems}
                        >
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="primary_contact_name" className="text-sm font-medium text-gray-700 form-required">Primary Contact — Full Name</Label>
                                    <Input id="primary_contact_name" value={data.primary_contact_name} onChange={(e) => setData('primary_contact_name', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.primary_contact_name} />
                                </div>

                                <div>
                                    <Label htmlFor="primary_phone" className="text-sm font-medium text-gray-700 form-required">License Contact Number</Label>
                                    <Input id="primary_phone" type="tel" value={data.primary_phone} onChange={(e) => setData('primary_phone', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.primary_phone} />
                                </div>

                                <div>
                                    <Label htmlFor="alternate_phone" className="text-sm font-medium text-gray-700 form-required">Alternate / Sales Contact Number</Label>
                                    <Input id="alternate_phone" type="tel" value={data.alternate_phone} onChange={(e) => setData('alternate_phone', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.alternate_phone} />
                                </div>

                                <div>
                                    <Label htmlFor="primary_email" className="text-sm font-medium text-gray-700 form-required">Email</Label>
                                    <Input id="primary_email" type="email" value={data.primary_email} onChange={(e) => setData('primary_email', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.primary_email} />
                                </div>

                                <div>
                                    <Label htmlFor="alternate_email" className="text-sm font-medium text-gray-700">Alternate Email</Label>
                                    <Input id="alternate_email" type="email" value={data.alternate_email} onChange={(e) => setData('alternate_email', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="city" className="text-sm font-medium text-gray-700 form-required">City</Label>
                                    <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.city} />
                                </div>

                                <div>
                                    <Label htmlFor="subcity" className="text-sm font-medium text-gray-700 form-required">Subcity</Label>
                                    <Input id="subcity" value={data.subcity} onChange={(e) => setData('subcity', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.subcity} />
                                </div>

                                <div>
                                    <Label htmlFor="woreda" className="text-sm font-medium text-gray-700 form-required">Woreda</Label>
                                    <Input id="woreda" value={data.woreda} onChange={(e) => setData('woreda', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.woreda} />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <MapPin className="mt-0.5 h-4 w-4 text-teal" />
                                <p className="text-xs text-gray-500">
                                    The registered location is used for matching the supplier with procurement requests.
                                </p>
                            </div>
                        </FormSectionCard>
                    )}

                    {currentStep === 3 && (
                        <FormSectionCard
                            title="Business Scope & Categories"
                            description="Tell us what your organization supplies and the areas in which you operate."
                            icon={<Tag className="h-5 w-5" />}
                            status={businessSection.status}
                            missingItems={businessSection.missingItems}
                        >
                            <div>
                                <Label className="text-sm font-medium text-gray-700 form-required">Procurement Type</Label>
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {procurementTypeOptions.map((option) => {
                                        const selected = ((data.procurement_type as string[]) || []).includes(option.value);

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => toggleProcurementType(option.value)}
                                                className={`rounded-xl border-2 p-3 text-center transition-all ${
                                                    selected ? 'border-teal bg-teal/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className={`text-sm font-medium ${selected ? 'text-teal' : 'text-gray-700'}`}>{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError className="mt-2" message={procurementTypeError} />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                            <div>
                                <Label htmlFor="products_services_description" className="text-sm font-medium text-gray-700 form-required">Products / Services Description</Label>
                                <Textarea
                                    id="products_services_description"
                                    value={data.products_services_description}
                                    onChange={(e) => setData('products_services_description', e.target.value)}
                                    className="mt-1.5"
                                    rows={4}
                                />
                                <InputError className="mt-2" message={errors.products_services_description} />
                            </div>
                        </FormSectionCard>
                    )}

                    {currentStep === 4 && (
                        <FormSectionCard
                            title="Bank & Financial"
                            description="Provide financial, banking, tax, and operational capacity information."
                            icon={<CreditCard className="h-5 w-5" />}
                            optional
                            status={financialSection.status}
                            missingItems={financialSection.missingItems}
                        >
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="bank_name" className="text-sm font-medium text-gray-700">Bank Name</Label>
                                    <Input id="bank_name" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="branch_name" className="text-sm font-medium text-gray-700">Branch Name</Label>
                                    <Input id="branch_name" value={data.branch_name} onChange={(e) => setData('branch_name', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="account_number" className="text-sm font-medium text-gray-700">Account Number</Label>
                                    <Input id="account_number" value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="account_holder_name" className="text-sm font-medium text-gray-700">Account Holder Name</Label>
                                    <Input id="account_holder_name" value={data.account_holder_name} onChange={(e) => setData('account_holder_name', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="number_of_employees" className="text-sm font-medium text-gray-700">Number of Employees</Label>
                                    <Input id="number_of_employees" type="number" value={data.number_of_employees} onChange={(e) => setData('number_of_employees', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="technical_personnel" className="text-sm font-medium text-gray-700">Technical Personnel</Label>
                                    <Input id="technical_personnel" type="number" value={data.technical_personnel} onChange={(e) => setData('technical_personnel', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="non_technical_personnel" className="text-sm font-medium text-gray-700">Non-Technical Personnel</Label>
                                    <Input id="non_technical_personnel" type="number" value={data.non_technical_personnel} onChange={(e) => setData('non_technical_personnel', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div>
                                    <Label htmlFor="tax_clearance_fiscal_year" className="text-sm font-medium text-gray-700">Tax Clearance Fiscal Year</Label>
                                    <Input id="tax_clearance_fiscal_year" value={data.tax_clearance_fiscal_year} onChange={(e) => setData('tax_clearance_fiscal_year', e.target.value)} className="mt-1.5 h-11" />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox id="subject_to_excise_tax" checked={data.subject_to_excise_tax} onCheckedChange={(checked) => setData('subject_to_excise_tax', !!checked)} />
                                    <Label htmlFor="subject_to_excise_tax" className="text-sm font-medium text-gray-700">Goods/services are subject to excise tax</Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox id="authorized_manufacturer_distributor" checked={data.authorized_manufacturer_distributor} onCheckedChange={(checked) => setData('authorized_manufacturer_distributor', !!checked)} />
                                    <Label htmlFor="authorized_manufacturer_distributor" className="text-sm font-medium text-gray-700">Authorized manufacturer / distributor</Label>
                                </div>
                            </div>
                        </FormSectionCard>
                    )}

                    {currentStep === 5 && (
                        <FormSectionCard
                            title="Ownership & Signatory"
                            description="Provide the authorized signatory information for the supplier organization."
                            icon={<ShieldCheck className="h-5 w-5" />}
                            status={ownershipSection.status}
                            missingItems={ownershipSection.missingItems}
                        >
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="owner_ceo_name" className="text-sm font-medium text-gray-700 form-required">Owner / CEO Name</Label>
                                    <Input id="owner_ceo_name" value={data.owner_ceo_name} onChange={(e) => setData('owner_ceo_name', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.owner_ceo_name} />
                                </div>

                                <div>
                                    <Label htmlFor="signatory_title" className="text-sm font-medium text-gray-700 form-required">Signatory Title</Label>
                                    <Input id="signatory_title" value={data.signatory_title} onChange={(e) => setData('signatory_title', e.target.value)} className="mt-1.5 h-11" />
                                    <InputError className="mt-2" message={errors.signatory_title} />
                                </div>
                            </div>
                        </FormSectionCard>
                    )}

                    {currentStep === 6 && (
                        <FormSectionCard
                            title="Supporting Documents"
                            description="Documents are uploaded once the registration has been saved."
                            icon={<FileCheck2 className="h-5 w-5" />}
                            status={documentsSection.status}
                            missingItems={documentsSection.missingItems}
                        >
                            <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">
                                <p className="text-xs text-teal">
                                    Required documents: {documentTypes.filter((documentType) => documentType.required).map((documentType) => documentType.label).join(', ')}. Accepted format: PDF. Maximum file size: 5 MB per document.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <Info className="mt-0.5 h-4 w-4 text-teal" />
                                <p className="text-sm text-gray-600">
                                    Save the registration first. You will be taken to the supplier record where you can upload or replace each document.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {documentTypes.map((documentType) => (
                                    <div key={documentType.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {documentType.label}
                                                {documentType.required && (
                                                    <span className="ml-1 text-red-500">*</span>
                                                )}
                                            </h3>
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                <FileCheck2 className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <p className="mt-1 text-[11px] text-gray-400">PDF � Max 5 MB</p>
                                    </div>
                                ))}
                            </div>
                        </FormSectionCard>
                    )}

                    {currentStep === 7 && (
                        <FormSectionCard
                            title="Declarations"
                            description="Please review the declaration before registering the supplier."
                            icon={<FileCheck2 className="h-5 w-5" />}
                            status={declarationSection.status}
                            missingItems={declarationSection.missingItems}
                        >
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="declaration_confirmed"
                                        checked={data.declaration_confirmed}
                                        onCheckedChange={(checked) => setData('declaration_confirmed', !!checked)}
                                        className="mt-0.5"
                                    />
                                    <Label htmlFor="declaration_confirmed" className="text-sm leading-relaxed text-gray-700">
                                        I confirm that the information provided is accurate, that the company is not debarred or blacklisted, and I agree to EEC supplier terms and conditions.
                                    </Label>
                                </div>
                                <InputError className="mt-2" message={errors.declaration_confirmed} />
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <Info className="mt-0.5 h-4 w-4 text-teal" />
                                <p className="text-sm text-gray-600">
                                    A supplier account is created with <span className="font-medium">{data.primary_email || 'the primary email'}</span> so the supplier can sign in and follow up on their registration.
                                </p>
                            </div>
                        </FormSectionCard>
                    )}
                </div>

                <div className="grid grid-cols-3 items-center border-t border-gray-200 pt-6">
                    <div className="justify-self-start">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => goToStep(currentStep - 1)}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Previous step
                        </Button>
                    </div>

                    <div className="justify-self-center">
                        <Button type="submit" variant="default" className="h-11 px-8 text-sm font-medium" disabled={processing}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {processing ? 'Registering...' : 'Register supplier'}
                        </Button>
                    </div>

                    <div className="justify-self-end">
                        {currentStep < totalStepCount && (
                            <Button
                                type="button"
                                className="h-11 bg-[#00515F] px-8 text-sm font-medium text-white hover:bg-[#00515F]/90"
                                onClick={() => goToStep(currentStep + 1)}
                            >
                                Next step
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
