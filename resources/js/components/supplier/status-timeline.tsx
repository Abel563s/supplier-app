import { CheckCircle2, CircleDot, Clock, XCircle } from 'lucide-react';

type TimelineStatus = 'completed' | 'current' | 'pending' | 'rejected';

interface TimelineStep {
    title: string;
    description: string;
    status: TimelineStatus;
    date?: string;
}

interface StatusTimelineProps {
    steps: TimelineStep[];
    title?: string;
    actionRequired?: string;
}

export default function StatusTimeline({ steps, title = 'Registration Status', actionRequired }: StatusTimelineProps) {
    return (
        <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

            {actionRequired && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="font-semibold text-amber-900">Action Required</h3>
                    <p className="mt-1 text-sm text-amber-800">{actionRequired}</p>
                </div>
            )}

            <div className="mt-8 space-y-6">
                {steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            {step.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-teal" />}
                            {step.status === 'current' && <CircleDot className="h-6 w-6 text-teal" />}
                            {step.status === 'pending' && <Clock className="h-6 w-6 text-gray-300" />}
                            {step.status === 'rejected' && <XCircle className="h-6 w-6 text-red-500" />}
                            {index < steps.length - 1 && <div className="mt-2 h-8 w-px bg-gray-200" />}
                        </div>
                        <div className="flex-1 pb-6">
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                            {step.date && <p className="mt-1 text-xs text-gray-400">{step.date}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
