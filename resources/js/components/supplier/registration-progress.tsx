import { AlertCircle, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Step {
    number: number;
    title: string;
    status: 'complete' | 'partial' | 'needs-attention' | 'not-started' | 'optional';
    href: string;
    metadata?: string;
}

interface RegistrationProgressProps {
    steps: Step[];
    currentStep: number;
}

const statusConfig = {
    complete: {
        icon: CheckCircle2,
        label: 'Complete',
        textClass: 'text-gray-900',
        subtextClass: 'text-gray-400',
        iconClass: 'text-teal',
    },
    partial: {
        icon: AlertCircle,
        label: 'Needs attention',
        textClass: 'text-gray-900',
        subtextClass: 'text-amber-600',
        iconClass: 'text-amber-500',
    },
    'needs-attention': {
        icon: AlertCircle,
        label: 'Needs attention',
        textClass: 'text-gray-900',
        subtextClass: 'text-amber-600',
        iconClass: 'text-amber-500',
    },
    'not-started': {
        icon: Circle,
        label: 'Not started',
        textClass: 'text-gray-500',
        subtextClass: 'text-gray-400',
        iconClass: 'text-gray-300',
    },
    optional: {
        icon: Circle,
        label: 'Optional',
        textClass: 'text-gray-500',
        subtextClass: 'text-gray-400',
        iconClass: 'text-gray-300',
    },
};

export default function RegistrationProgress({ steps, currentStep }: RegistrationProgressProps) {
    const completedCount = steps.filter((s) => s.status === 'complete').length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <aside className="hidden lg:block w-64 shrink-0 py-8">
            <div className="sticky top-24">
                <div className="mb-8">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Registration Progress</h2>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{progressPercent}%</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {completedCount} of {steps.length} sections completed
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-full rounded-full bg-teal transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <nav className="space-y-1">
                    {steps.map((step) => {
                        const rawStatus = step.number === 4 && step.status === 'not-started' ? 'optional' : step.status;
                        const config = statusConfig[rawStatus];
                        const isCurrent = step.number === currentStep;
                        const Icon = isCurrent ? CircleDot : config.icon;

                        return (
                            <Link
                                key={step.number}
                                href={step.href}
                                className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
                                    isCurrent ? 'bg-teal/5' : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="mt-0.5">
                                    <Icon className={`h-5 w-5 ${isCurrent ? 'text-teal' : config.iconClass}`} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-teal' : config.textClass}`}>
                                            {step.title}
                                        </p>
                                        {isCurrent && (
                                            <span className="text-xs font-medium text-teal whitespace-nowrap">Current</span>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${config.subtextClass}`}>
                                        {step.metadata || config.label}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
