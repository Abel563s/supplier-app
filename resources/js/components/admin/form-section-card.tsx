import { type ReactNode } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface FormSectionCardProps {
    id?: string;
    icon: ReactNode;
    title: string;
    description: string;
    optional?: boolean;
    status?: 'complete' | 'partial' | 'not-started';
    missingItems?: string[];
    children: ReactNode;
}

const statusLabels: Record<string, string> = {
    complete: 'Complete',
    partial: 'Incomplete',
    'not-started': 'Incomplete',
};

export default function FormSectionCard({ id, icon, title, description, optional = false, status = 'not-started', missingItems = [], children }: FormSectionCardProps) {
    const isComplete = status === 'complete';
    const statusLabel = statusLabels[status] ?? 'Incomplete';

    return (
        <div
            id={id}
            className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
        >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                            {optional && <span className="ml-2 text-xs font-normal text-gray-400">Optional</span>}
                        </h3>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                </div>

                <div className="text-right">
                    {isComplete ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {statusLabel}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Circle className="h-3.5 w-3.5" />
                            {statusLabel}
                        </span>
                    )}

                    {! isComplete && missingItems.length > 0 && (
                        <p className="mt-1.5 text-xs text-amber-700">
                            Missing: {missingItems.join(', ')}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-6">{children}</div>
        </div>
    );
}
