import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, SearchCheck, XCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TimelineStatus = 'completed' | 'current' | 'pending' | 'rejected';

interface TimelineStep {
    title: string;
    description: string;
    status: TimelineStatus;
    date?: string;
}

const defaultSteps: TimelineStep[] = [
    { title: 'Submitted', description: 'Application received and under initial review.', status: 'completed', date: 'Nov 1, 2026' },
    { title: 'Under Review', description: 'Documents and information being evaluated.', status: 'current', date: 'Nov 5, 2026' },
    { title: 'Document Verification', description: 'Supporting documents are being verified.', status: 'pending' },
    { title: 'Evaluation', description: 'Final assessment and approval decision.', status: 'pending' },
    { title: 'Approved', description: 'Registration complete. Welcome to EEC.', status: 'pending' },
];

const trackedSteps: TimelineStep[] = [
    { title: 'Submitted', description: 'Application received and under initial review.', status: 'completed', date: 'Nov 1, 2026' },
    { title: 'Under Review', description: 'Documents and information being evaluated.', status: 'completed', date: 'Nov 5, 2026' },
    { title: 'Document Verification', description: 'Supporting documents are being verified.', status: 'current', date: 'Nov 8, 2026' },
    { title: 'Evaluation', description: 'Final assessment and approval decision.', status: 'pending' },
    { title: 'Approved', description: 'Registration complete. Welcome to EEC.', status: 'pending' },
];

export default function SupplierStatusCta() {
    const [trackingCode, setTrackingCode] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [steps, setSteps] = useState<TimelineStep[]>(defaultSteps);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!trackingCode.trim()) {
            setError('Please enter your application/registration number.');
            return;
        }

        setIsTracking(true);
        setShowResults(false);

        setTimeout(() => {
            setIsTracking(false);
            setShowResults(true);
            setSteps(trackedSteps);
        }, 1200);
    };

    const getMarkerClass = (status: TimelineStatus) => {
        switch (status) {
            case 'completed':
                return 'border-[#00515F] bg-[#00515F] text-white';
            case 'current':
                return 'border-[#00ADC5] bg-[#00ADC5] text-white';
            case 'rejected':
                return 'border-red-500 bg-red-500 text-white';
            default:
                return 'border-[#e2e8f0] bg-[#F8FAFC] text-[#94A3B8]';
        }
    };

    const getTitleClass = (status: TimelineStatus) => {
        switch (status) {
            case 'completed':
            case 'current':
                return 'text-[#172B3A]';
            default:
                return 'text-[#94A3B8]';
        }
    };

    return (
        <section id="tracking" className="bg-[#F5F9F9] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left - Tracking Form */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">Already Registered?</h2>
                            <p className="mt-4 text-lg leading-relaxed text-[#647783]">
                                Track your supplier registration status and continue managing your application.
                            </p>
                        </div>

                        <form onSubmit={handleTrack} className="space-y-4">
                            <div>
                                <Label htmlFor="tracking">Application / Registration Number</Label>
                                <Input
                                    id="tracking"
                                    type="text"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    placeholder="e.g. SUP-2026-00124"
                                    className="pr-4"
                                />
                                {error && (
                                    <p className="mt-1.5 text-sm text-red-600">{error}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-[#00515F] text-white hover:bg-[#00ADC5] shadow-lg hover:shadow-[0_0_24px_rgba(0,81,95,0.30)] transition-all duration-300 disabled:opacity-70"
                                disabled={isTracking}
                            >
                                {isTracking && <ArrowRight className="h-4 w-4 animate-spin mr-2" />}
                                Track Registration
                            </Button>
                        </form>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button variant="outline" className="border-[#00515F] text-[#00515F] hover:bg-[#00515F]/5" asChild>
                                <Link href="/supplier-registration/login">Supplier Login</Link>
                            </Button>
                            <Button variant="ghost" className="text-[#647783] hover:text-[#00515F]" asChild>
                                <Link href="/supplier-registration/status">View Full Status</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right - Application Tracking Timeline */}
                    <div className="relative">
                        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-[0_24px_60px_rgba(13,59,57,0.06)]">
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-[#172B3A]">Application Status</h3>
                                <p className="mt-1 text-sm text-[#647783]">Track your registration progress through each stage.</p>
                            </div>

                            {showResults ? (
                                <div className="relative pl-12">
                                    <div className="absolute left-3 top-4 bottom-4 w-[2px] bg-[#e2e8f0]" />

                                    {steps.map((step, index) => {
                                        const isLast = index === steps.length - 1;
                                        const markerClass = getMarkerClass(step.status);
                                        const titleClass = getTitleClass(step.status);
                                        const isCurrent = step.status === 'current';
                                        const isCompleted = step.status === 'completed';
                                        const isRejected = step.status === 'rejected';

                                        return (
                                            <div key={step.title} className="relative flex gap-4 mb-8">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${markerClass}`}>
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        ) : isCurrent ? (
                                                            <Clock className="h-5 w-5" />
                                                        ) : isRejected ? (
                                                            <XCircle className="h-5 w-5" />
                                                        ) : null}
                                                    </div>
                                                    {!isLast && (
                                                        <div className="mt-2 h-[60px] w-[2px] bg-[#e2e8f0]" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h4 className={`text-sm font-bold ${titleClass}`}>
                                                            {step.title}
                                                            {isCurrent && (
                                                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00ADC5]/10 text-[#00515F] text-[10px] font-medium">
                                                                    Current
                                                                </span>
                                                            )}
                                                            {isRejected && (
                                                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-medium">
                                                                    Rejected
                                                                </span>
                                                            )}
                                                        </h4>
                                                        {step.date && (
                                                            <span className="text-[11px] text-[#647783]">{step.date}</span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-[#647783]">{step.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-[#94A3B8] mx-auto mb-4">
                                        <SearchCheck className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-[#172B3A]">Enter your registration number</h4>
                                    <p className="mt-1 text-sm text-[#647783]">Track your application status and see your progress through each stage.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
