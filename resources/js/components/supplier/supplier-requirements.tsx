import { FileText, Lock, Mail, Building2, Users, Tag, CreditCard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const preparationItems = [
    { icon: Building2, label: 'Valid Business License' },
    { icon: Mail, label: 'Tax Identification Number (TIN)' },
    { icon: Lock, label: 'VAT Registration Certificate (if applicable)' },
    { icon: Users, label: 'Contact Person Information' },
    { icon: Tag, label: 'Product or Service Categories' },
    { icon: ShieldCheck, label: 'Relevant Professional Certificates' },
    { icon: CreditCard, label: 'Banking Information (where required)' },
    { icon: FileText, label: 'Company Profile' },
];

const documentCatalog = [
    { key: 'business_registration', label: 'Business Registration Certificate', required: true, description: 'Official document proving your company is legally registered.' },
    { key: 'business_license', label: 'Business License', required: true, description: 'Valid trade license authorizing your business operations.' },
    { key: 'tin_certificate', label: 'TIN Certificate', required: true, description: 'Tax Identification Number issued by the tax authority.' },
    { key: 'tax_clearance_certificate', label: 'Tax Clearance Certificate', required: true, description: 'Certificate confirming your tax compliance status.' },
    { key: 'vat_certificate', label: 'VAT Registration Certificate', required: true, description: 'Required if your business is VAT-registered.' },
    { key: 'egp_registration_letter', label: 'EGP Registration Letter', required: true, description: 'Ethiopian Government Procurement registration letter.' },
];

export default function SupplierRequirements() {
    const [activeDoc, setActiveDoc] = useState(-1);

    return (
        <section id="requirements" className="bg-[#F5F9F9] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">Prepare for Your Registration</h2>
                    <p className="mt-4 text-lg text-[#647783]">
                        Have your business information and required documents ready before starting your registration.
                    </p>
                </div>

                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left - Preparation Checklist */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-[#172B3A]">Information Checklist</h3>
                            <p className="mt-2 text-sm text-[#647783]">Gather these details before you begin.</p>
                        </div>

                        <ul className="divide-y divide-[#e2e8f0]">
                            {preparationItems.map((item) => (
                                <li key={item.label} className="flex items-center gap-3 py-4">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00515F]/5 text-[#00515F]">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm text-[#172B3A]">{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right - Document Preparation Panel */}
                    <div className="relative">
                        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-[0_24px_60px_rgba(13,59,57,0.06)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#172B3A]">Document Checklist</h3>
                                    <p className="mt-1 text-sm text-[#647783]">Required and supporting documents for registration.</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00ADC5]/10 text-[#00515F] font-bold text-sm">
                                    6 Docs
                                </div>
                            </div>

                            <div className="space-y-2">
                                {documentCatalog.map((doc, index) => (
                                    <div
                                        key={doc.key}
                                        className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-200 cursor-pointer border-2 ${
                                            activeDoc === index
                                                ? 'border-[#00ADC5] bg-[#F0FDFC]'
                                                : 'border-transparent bg-transparent hover:border-[#e2e8f0] hover:bg-[#F8FAFC]'
                                        }`}
                                        onMouseEnter={() => setActiveDoc(index)}
                                        onMouseLeave={() => setActiveDoc(-1)}
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00515F]/5 text-[#00515F]">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#172B3A]">{doc.label}</p>
                                            <p className="text-[11px] text-[#647783]">{doc.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                                doc.required ? 'bg-[#00515F]/10 text-[#00515F]' : 'bg-[#F8FAFC] text-[#647783]'
                                            }`}>
                                                {doc.required ? 'Required' : 'Conditional'}
                                            </span>
                                            <span className="text-[10px] font-medium text-[#94A3B8]">PDF • JPG • PNG</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-[#F8FAFC] p-5">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-[#00515F]" />
                                    <p className="text-sm font-medium text-[#172B3A]">Submission Guidelines</p>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-[#647783]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[#172B3A]">Accepted formats:</span>
                                        <span>PDF, JPG, PNG</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[#172B3A]">Max file size:</span>
                                        <span>5 MB per file</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
