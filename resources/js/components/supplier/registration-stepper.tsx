import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Step {
    number: number;
    title: string;
    shortTitle: string;
    status: 'complete' | 'partial' | 'needs-attention' | 'not-started' | 'optional';
    href: string;
    alwaysClickable?: boolean;
}

interface RegistrationStepperProps {
    steps: Step[];
    currentStep: number;
    onSelectStep?: (step: number) => void;
    /**
     * Navigation mode ticks the completed steps, shows numbers for the remaining
     * steps, and allows visiting every step.
     */
    mode?: 'progress' | 'navigation';
}

export default function RegistrationStepper({ steps, currentStep, onSelectStep, mode = 'progress' }: RegistrationStepperProps) {
    const isNavigationMode = mode === 'navigation';

    return (
        <div className="flex w-full justify-center">
            <div className="flex items-center gap-3">
                {steps.map((step, index) => {
                    const rawStatus = step.number === 4 && step.status === 'not-started' ? 'optional' : step.status;
                    const isCurrent = step.number === currentStep;
                    const isComplete = rawStatus === 'complete';
                    const isClickable = isNavigationMode || isComplete || isCurrent || Boolean(step.alwaysClickable);

                    const inner = (
                        <div className={`flex flex-col items-center text-center gap-2 ${isClickable ? 'transition-transform hover:scale-105' : ''}`}>
                            <span className={`text-xs font-semibold ${isCurrent ? 'text-teal' : rawStatus === 'not-started' || rawStatus === 'optional' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Step {step.number}
                            </span>
                            {isComplete ? (
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal bg-teal`}>
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                            ) : (
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                    isCurrent ? 'border-teal bg-teal text-white' : 'border-gray-300 bg-white text-gray-500'
                                }`}>
                                    {isNavigationMode ? (
                                        <span className="text-xs font-semibold">{step.number}</span>
                                    ) : (
                                        <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                            )}
                            <span className={`text-xs font-medium ${isCurrent ? 'text-teal' : isComplete ? 'text-gray-600' : rawStatus === 'not-started' || rawStatus === 'optional' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {step.shortTitle}
                            </span>
                        </div>
                    );

                    return (
                        <div key={step.number} className="flex items-center">
                            {isClickable ? (
                                onSelectStep ? (
                                    <button type="button" onClick={() => onSelectStep(step.number)}>
                                        {inner}
                                    </button>
                                ) : (
                                    <Link href={step.href}>{inner}</Link>
                                )
                            ) : (
                                <div className="cursor-default">{inner}</div>
                            )}
                            {index < steps.length - 1 && (
                                <div className={`mx-1 h-0.5 w-6 transition-colors ${
                                    isComplete ? 'bg-teal' : 'bg-gray-200'
                                }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
