import { Head } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSection from '@/components/supplier/form-section';
import ReviewSection from '@/components/supplier/review-section';
import Declaration from '@/components/supplier/declaration-checkbox';
import { Separator } from '@/components/ui/separator';

const declarations = [
    { id: 'accuracy', text: 'I confirm that the information provided in this registration is accurate and complete.' },
    { id: 'terms', text: 'I agree to the supplier registration terms and conditions.' },
    { id: 'updates', text: 'I understand that I must update this information if any changes occur.' },
];

export default function ReviewRegistration() {
    return (
        <SupplierLayout currentStep={7}>
            <Head title="Review & Submit" />

            <FormSection
                title="Review Your Registration"
                description="Please review your information carefully before submitting your application."
                onBack="/supplier/registration/documents"
                onNext={() => {}}
                submitLabel="Submit Registration"
            >
                <div className="space-y-6">
                    <ReviewSection title="Company Information" editHref="/supplier/registration/company">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Company Legal Name</p>
                                <p className="mt-1 text-sm text-gray-900">ABC Construction PLC</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Registration Number</p>
                                <p className="mt-1 text-sm text-gray-900">123456</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Business Type</p>
                                <p className="mt-1 text-sm text-gray-900">Private Limited Company</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tax ID</p>
                                <p className="mt-1 text-sm text-gray-900">987654321</p>
                            </div>
                        </div>
                    </ReviewSection>

                    <ReviewSection title="Contact Information" editHref="/supplier/registration/contact">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact Person</p>
                                <p className="mt-1 text-sm text-gray-900">John Doe</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Position</p>
                                <p className="mt-1 text-sm text-gray-900">Procurement Manager</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                                <p className="mt-1 text-sm text-gray-900">john@abcconstruction.com</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
                                <p className="mt-1 text-sm text-gray-900">+251 911 234 567</p>
                            </div>
                        </div>
                    </ReviewSection>

                    <ReviewSection title="Business Information" editHref="/supplier/registration/business">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Products / Services</p>
                                <p className="mt-1 text-sm text-gray-900">Construction materials and civil engineering supplies.</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Business Categories</p>
                                <p className="mt-1 text-sm text-gray-900">Construction Materials, Professional Services</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Years in Business</p>
                                <p className="mt-1 text-sm text-gray-900">12</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Number of Employees</p>
                                <p className="mt-1 text-sm text-gray-900">85</p>
                            </div>
                        </div>
                    </ReviewSection>

                    <ReviewSection title="Documents" editHref="/supplier/registration/documents">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-teal" />
                                Business Registration
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-teal" />
                                Business License
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-teal" />
                                Tax Certificate
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                <span className="h-2 w-2 rounded-full bg-teal" />
                                Tax Clearance Certificate
                            </div>
                        </div>
                    </ReviewSection>
                </div>

                <Separator className="my-8" />

                <Declaration declarations={declarations} checked={{}} onChange={() => {}} />
            </FormSection>
        </SupplierLayout>
    );
}
