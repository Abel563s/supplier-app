import { Head, Link } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import SectionCard from '@/components/supplier/section-card';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface CorrectionRequest {
    id: number;
    section: string;
    reason: string;
    created_at: string;
}

export interface DashboardProps {
    supplier: Record<string, unknown>;
    supplierStatus?: string;
    lastSavedStep?: number | null;
    correctionRequests?: CorrectionRequest[];
    completion: {
        steps: Array<{ number: number; title: string; status: string; href: string; metadata?: string }>;
        completedSteps: number;
        totalSteps: number;
        percentage: number;
    };
}

const stepMetadata: Record<number, string> = {
    1: '7 required fields',
    2: '5 required fields',
    3: '3 required fields',
    4: 'Optional',
    5: '1 required field',
    6: '4 minimum documents',
    7: 'Not completed',
};

const correctionSectionLabels: Record<string, string> = {
    legal_entity: 'Legal Entity',
    contact: 'Contact & Location',
    business_scope: 'Business Scope',
    financial: 'Bank & Financial',
    ownership: 'Ownership',
    documents: 'Documents',
    declaration: 'Declaration',
};

const correctionSectionSteps: Record<string, number> = {
    legal_entity: 1,
    contact: 2,
    business_scope: 3,
    financial: 4,
    ownership: 5,
    documents: 6,
    declaration: 7,
};

export default function SupplierDashboard({ completion, supplierStatus, lastSavedStep = 1, correctionRequests = [] }: DashboardProps) {
    const statusMap: Record<string, 'completed' | 'in-progress' | 'not-started' | 'needs-attention'> = {
        complete: 'completed',
        partial: 'needs-attention',
        'needs-attention': 'needs-attention',
        'not-started': 'not-started',
        optional: 'not-started',
    };

    const isSubmitted = supplierStatus === 'submitted' || supplierStatus === 'approved';

    const sections = completion.steps
        .filter((step) => isSubmitted || step.number === lastSavedStep)
        .map((step) => ({
            number: step.number,
            title: step.title,
            description: step.metadata || stepMetadata[step.number] || '',
            status: statusMap[step.status] || 'not-started',
            href: step.href,
            progress: step.status === 'complete' ? 100 : step.status === 'partial' ? 50 : 0,
        }));

    return (
        <SupplierLayout isDashboard>
            <Head title="Supplier Registration" />

            <div className="w-full">
                <div className="mb-10">
                    <h1 className="text-[28px] font-bold text-gray-900">Supplier Registration</h1>
                    <p className="mt-3 text-base text-gray-600">Complete your company registration to become a registered EEC supplier.</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">Registration Progress</h2>
                            <p className="mt-2 text-4xl font-bold text-gray-900">{completion.percentage}% Complete</p>
                            <p className="mt-1 text-base text-gray-600">
                                {completion.completedSteps} of {completion.totalSteps} sections completed
                            </p>
                        </div>
                        <div className="text-left lg:text-right">
                            <p className="text-sm font-medium text-gray-500">Last saved</p>
                            <p className="text-sm font-semibold text-gray-900">Just now</p>
                        </div>
                    </div>
                    <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-teal transition-all duration-500"
                            style={{ width: `${completion.percentage}%` }}
                        />
                    </div>
                </div>

                {correctionRequests.length > 0 && (
                    <section
                        aria-labelledby="correction-requests-title"
                        className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm"
                    >
                        <div className="flex items-start gap-4 border-b border-amber-200/80 px-5 py-4 sm:px-6">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <AlertCircle className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 id="correction-requests-title" className="text-base font-semibold text-amber-950">
                                    Changes requested
                                </h2>
                                <p className="mt-1 text-sm text-amber-900/80">
                                    Please review and submit the requested updates. Each message will disappear after its section is corrected.
                                </p>
                            </div>
                        </div>
                        <div className="divide-y divide-amber-200/80">
                            {correctionRequests.map((request) => {
                                const step = correctionSectionSteps[request.section];
                                const href = completion.steps.find((item) => item.number === step)?.href;
                                const sectionLabel = correctionSectionLabels[request.section] ?? request.section.replace(/_/g, ' ');

                                return (
                                    <div key={request.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold capitalize text-amber-950">{sectionLabel}</p>
                                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-amber-900">{request.reason}</p>
                                        </div>
                                        {href && (
                                            <Link
                                                href={href}
                                                className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-900 sm:self-center"
                                            >
                                                Review section
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {sections.map((section) => (
                        <SectionCard key={section.title} {...section} />
                    ))}
                </div>
            </div>
        </SupplierLayout>
    );
}
