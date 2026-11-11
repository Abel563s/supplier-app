import { ArrowRight, CheckCircle2, ClipboardCheck, SearchCheck, ShieldCheck, BarChart3, Building, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

interface SupplierHeroProps {
    onOpenFaq?: () => void;
}

const trustItems = [
    { icon: ShieldCheck, label: 'Secure Registration' },
    { icon: ClipboardCheck, label: 'Transparent Evaluation' },
    { icon: SearchCheck, label: 'Application Tracking' },
];

// Animated counter component
function AnimatedCounter({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Icon }) {
    const [displayValue, setDisplayValue] = useState(0);
    const [animated, setAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !animated && ref.current) {
                    setAnimated(true);
                    let current = 0;
                    const increment = value / 60;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= value) {
                            setDisplayValue(value);
                            clearInterval(timer);
                        } else {
                            setDisplayValue(Math.floor(current));
                        }
                    }, 16);
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, animated]);

    return (
        <div ref={ref} className="relative rounded-2xl border border-white/80 bg-white/70 p-6 backdrop-blur-md shadow-[0_20px_40px_rgba(13,59,57,0.06)]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00515F]/10 text-[#00515F]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <span className="text-3xl font-bold tracking-tight text-[#172B3A] transition-all duration-300">{displayValue}+</span>
            <p className="mt-1 text-sm text-[#647783]">{label}</p>
        </div>
    );
}

const stats = [
    {
        value: 12,
        label: 'Supplier Categories',
        icon: Building,
    },
    {
        value: 7,
        label: 'Required Documents',
        icon: ShieldCheck,
    },
    {
        value: 7,
        label: 'Registration Steps',
        icon: CheckCircle2,
    },
    {
        value: 24,
        label: 'Hours / 7 Days Support',
        icon: BarChart3,
    },
];

const journeySteps = [
    { number: 1, title: 'Legal Entity & Identification', description: 'Company registration and legal identification details.', status: 'completed' as const },
    { number: 2, title: 'Contact & Location', description: 'Primary contact and company location information.', status: 'completed' as const },
    { number: 3, title: 'Business Scope & Categories', description: 'Products, services, categories and relevant experience.', status: 'current' as const },
    { number: 4, title: 'Bank & Financial', description: 'Banking and financial information where applicable.', status: 'pending' as const },
    { number: 5, title: 'Ownership & Signatory', description: 'Authorized signatory and ownership information.', status: 'pending' as const },
    { number: 6, title: 'Supporting Documents', description: 'Upload required company and compliance documents.', status: 'pending' as const },
    { number: 7, title: 'Declarations', description: 'Confirm accuracy and accept supplier terms.', status: 'pending' as const },
];

export default function SupplierHero({ onOpenFaq }: SupplierHeroProps) {
    const [activeStep, setActiveStep] = useState(1);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const completedCount = journeySteps.filter((s) => s.status === 'completed').length;
    const totalSteps = journeySteps.length;
    const progressPercent = Math.round((completedCount / totalSteps) * 100);

    return (
        <section className="relative overflow-hidden bg-[#F5F9F9]">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00515F]/[0.03] blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#00ADC5]/[0.02] blur-[120px]" />
            </div>

            <div className="relative mx-auto w-full px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
                <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
                    {/* Left side - Hero Introduction */}
                    <div className="space-y-8 lg:pr-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#00515F]/10 px-4 py-1.5 text-xs font-semibold text-[#00515F]">
                            <span className="relative -top-[1px] flex h-2 w-2 rounded-full bg-[#00ADC5]" />
                            Partner With EEC
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-5xl lg:text-6xl">
                            Grow With Opportunity.
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-[#647783]">
                            Join the EEC supplier network and connect your business with procurement opportunities across our construction and engineering operations.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <Button size="lg" className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-12 px-8 text-sm font-medium shadow-lg hover:shadow-[0_0_24px_rgba(0,81,95,0.30)] transition-all duration-300" asChild>
                                <Link href="/supplier-registration/register">
                                    Start Supplier Registration <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="border-[#00515F] text-[#00515F] hover:bg-[#00515F]/5 h-12 px-8 text-sm font-medium transition-all duration-300" asChild>
                                <Link href="#requirements">
                                    Explore Requirements
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-5">
                            {trustItems.map((item) => (
                                <span key={item.label} className="flex items-center gap-2 text-sm font-medium text-[#647783]">
                                    <item.icon className="h-4 w-4 text-[#00515F]" />
                                    {item.label}
                                </span>
                            ))}
                            {onOpenFaq && (
                                <button
                                    type="button"
                                    onClick={onOpenFaq}
                                    className="text-sm font-semibold text-[#00515F] underline underline-offset-2 transition-colors hover:opacity-80"
                                >
                                    FAQs
                                </button>
                            )}
                        </div>

                        <p className="mt-6 text-sm text-[#647783]">
                            Already registered?{' '}
                            <Link href="/supplier-registration/login" className="font-semibold text-[#00515F] hover:underline">
                                Sign in to your supplier account
                            </Link>
                        </p>
                    </div>

                    {/* Right side - EEC Supplier Network Stats */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#00ADC5]/10 px-4 py-1.5 text-xs font-semibold text-[#00ADC5]">
                                <Users className="h-3 w-3" />
                                EEC Supplier Network
                            </span>
                            <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">
                                Trusted by Growing Supplier Network
                            </h2>
                            <p className="text-lg text-[#647783]">
                                Join thousands of suppliers already connected to EEC procurement opportunities.
                            </p>
                        </div>

                        {/* Animated Stat Grid */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <AnimatedCounter key={stat.label} {...stat} />
                            ))}
                        </div>

                        {/* Insight Note */}
                        <div className="rounded-xl border border-[#e2e8f0] bg-[#F8FAFC] p-5">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-4 w-4 text-[#00515F]" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#00515F]">Network Insight</span>
                            </div>
                            <p className="mt-2 text-sm text-[#647783]">
                                Figures are illustrative network indicators. Actual registration metrics are available in your supplier dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Full-width Registration Journey Section */}
                <div className="mt-16 lg:mt-20">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-[#00ADC5]/10 px-4 py-1.5 text-xs font-semibold text-[#00ADC5]">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Registration Journey
                                </span>
                                <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">
                                    A Simple Journey to Becoming an EEC Supplier
                                </h2>
                                <p className="text-lg text-[#647783]">
                                    Our structured registration process makes it easy to submit your company information and become part of the EEC supplier network.
                                </p>
                            </div>
                        </div>

                        {/* Stepper */}
                        <div className="relative">
                            <div className="absolute top-[20px] left-0 right-0 h-[2px] bg-[#e2e8f0] -z-10" />
                            <div className="flex items-center gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-4 scrollbar-hide">
                                {journeySteps.map((step, index) => {
                                    const isCompleted = step.status === 'completed';
                                    const isCurrent = step.status === 'current';
                                    const showConnector = index < journeySteps.length - 1;

                                    return (
                                        <div
                                            key={step.number}
                                            className="relative z-10 cursor-pointer transition-transform duration-300 hover:-translate-y-1 flex flex-col items-center gap-2 min-w-[140px]"
                                            onMouseEnter={() => {
                                                setActiveStep(step.number);
                                                setShowTooltip(true);
                                            }}
                                            onMouseLeave={() => setShowTooltip(false)}
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 40 });
                                            }}
                                        >
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                isCompleted ? 'border-[#00515F] bg-[#00515F] text-white shadow-[0_0_12px_rgba(0,81,95,0.30)]' : isCurrent ? 'border-[#00ADC5] bg-[#00ADC5] text-white shadow-[0_0_12px_rgba(0,173,197,0.40)]' : 'border-[#e2e8f0] bg-[#F8FAFC] text-[#647783]'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                                            </div>
                                            <span className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-[#172B3A]' : 'text-[#94A3B8]'}`}>
                                                {step.title}
                                            </span>
                                            {showConnector && (
                                                <div className="absolute top-[20px] right-[-20px] -translate-y-1/2 h-[2px] w-12 bg-[#e2e8f0]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-[#647783]">Registration Progress</span>
                                    <span className="text-sm font-bold text-[#172B3A]">{progressPercent}%</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                                    <div className="h-full bg-[#00515F] transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className="mt-2 text-[11px] text-[#647783]">
                                    {completedCount} of {totalSteps} stages complete • Est. <span className="font-semibold text-[#172B3A]">10–15 min</span>
                                </p>
                            </div>
                        </div>

                        {/* Step tooltip */}
                        {showTooltip && (
                            <div
                                className="absolute -z-10 pointer-events-none"
                                style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                            >
                                <div className="relative -translate-x-1/2 -translate-y-full z-10 rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-lg">
                                    <p className="text-sm font-medium text-[#172B3A]">{journeySteps[activeStep - 1]?.title}</p>
                                    <p className="mt-1 text-xs text-[#647783]">{journeySteps[activeStep]?.description || ''}</p>
                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-5 border-r-5 border-t-5 border-white border-transparent" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
