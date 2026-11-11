import { Building2, CheckCircle2, FileCheck, Landmark, Send, Tags } from 'lucide-react';

const steps = [
    { icon: Landmark, title: 'Legal Entity & Identification', description: 'Company registration and legal identification details.' },
    { icon: Building2, title: 'Contact & Location', description: 'Primary contact and company location information.' },
    { icon: Tags, title: 'Business Scope & Categories', description: 'Products, services, categories and relevant experience.' },
    { icon: FileCheck, title: 'Bank & Financial', description: 'Banking and financial information where applicable.', optional: true },
    { icon: Send, title: 'Ownership & Signatory', description: 'Authorized signatory and ownership information.' },
    { icon: Tags, title: 'Supporting Documents', description: 'Upload required company and compliance documents.' },
    { icon: CheckCircle2, title: 'Declarations', description: 'Confirm the accuracy of submitted information and supplier terms.' },
];

export default function RegistrationSteps() {
    return (
        <section id="process" className="bg-[#F5F9F9] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">A Simple Journey to Becoming an EEC Supplier</h2>
                    <p className="mt-4 text-lg text-[#647783]">
                        Our structured registration process makes it easy to submit your company information and become part of the EEC supplier network.
                    </p>
                </div>

                {/* Horizontal Timeline */}
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="absolute top-[40px] left-0 right-0 h-[1px] bg-[#e2e8f0]" />

                    <div className="relative flex flex-col gap-12 sm:flex-row sm:gap-8">
                        {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;

                            return (
                                <div key={step.title} className="relative flex flex-col gap-2 sm:w-0 sm:flex-1">
                                    {/* Step marker */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#00515F] bg-[#00515F] text-white shadow-md transition-all duration-300 hover:scale-110">
                                        <step.icon className="h-4 w-4" />
                                    </div>

                                    {/* Connector line */}
                                    {!isLast && (
                                        <div className="absolute -top-[38px] left-1/2 -translate-x-1/2 h-2 w-full bg-[#e2e8f0] sm:hidden" />
                                    )}

                                    <div className="mt-4 text-center sm:mt-6">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00515F]">Step {index + 1}</span>
                                        <h3 className="mt-1 text-sm font-semibold text-[#172B3A]">{step.title}</h3>
                                        <p className="mt-1 text-xs leading-relaxed text-[#647783]">{step.description}</p>
                                        {step.optional && (
                                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-3 py-0.5 text-[10px] font-medium text-[#647783]">
                                                Optional
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
