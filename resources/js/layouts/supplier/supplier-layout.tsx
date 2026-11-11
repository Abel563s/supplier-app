import { NotificationButton } from '@/components/notifications/NotificationButton';
import RegistrationStepper from '@/components/supplier/registration-stepper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import { HelpCircle, LogOut, User } from 'lucide-react';
import { type ReactNode } from 'react';

interface SupplierLayoutProps {
    children: ReactNode;
    currentStep?: number;
    isDashboard?: boolean;
}

export const stepMetadata: Record<number, { shortTitle: string; title: string; description: string }> = {
    1: {
        shortTitle: 'Legal Entity',
        title: 'Legal Entity & Identification',
        description: 'Provide the legal and registration information of your organization.',
    },
    2: { shortTitle: 'Contact', title: 'Contact & Location', description: 'Provide the primary contact details and registered business location.' },
    3: {
        shortTitle: 'Business Scope',
        title: 'Business Scope & Categories',
        description: 'Tell us what your organization supplies and the areas in which you operate.',
    },
    4: {
        shortTitle: 'Financial',
        title: 'Bank & Financial',
        description: 'Provide financial, banking, tax, and operational capacity information. Optional.',
    },
    5: {
        shortTitle: 'Ownership',
        title: 'Ownership & Signatory',
        description: 'Provide the authorized signatory information for the supplier organization.',
    },
    6: {
        shortTitle: 'Documents',
        title: 'Supporting Documents',
        description: 'Upload the documents required to support your supplier registration.',
    },
    7: {
        shortTitle: 'Declarations',
        title: 'Declarations',
        description: 'Please review the declaration before submitting your supplier registration.',
    },
};

export default function SupplierLayout({ children, currentStep = 1, isDashboard = false }: SupplierLayoutProps) {
    const page = usePage();
    const rawCompletion = (page.props.completion as {
        steps?: Array<{ number: number; title: string; status: string; href: string; metadata?: string }>;
    }) || { steps: [] };

    const steps = (rawCompletion.steps || []).map((step) => ({
        ...step,
        shortTitle: step.title.split(' ').slice(0, 2).join(' '),
        status: step.status as 'complete' | 'partial' | 'needs-attention' | 'not-started' | 'optional',
    }));

    const metadata = stepMetadata[currentStep] || { title: '', description: '' };
    const completedCount = steps.filter((s) => s.status === 'complete').length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="flex h-screen flex-col bg-[#F7FAFB] text-gray-800">
            <header className="shrink-0 border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logo/EEC-logo.jpg" alt="EEC Logo" className="h-8 w-auto rounded-lg" />
                            <span className="text-lg font-semibold text-gray-900">Supplier Portal</span>
                        </Link>

                        <nav className="hidden items-center gap-6 md:flex">
                            <Link href="/supplier" className="hover:text-teal text-sm font-medium text-gray-600 transition-colors">
                                Registration Status
                            </Link>
                            <Link href="#help" className="hover:text-teal text-sm font-medium text-gray-600 transition-colors">
                                Help
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationButton className="ml-2" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src="" alt="User" />
                                        <AvatarFallback className="bg-teal/10 text-teal">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')} as="button" className="w-full text-left">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Help
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/logout" method="post" as="button" className="w-full text-left">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="scrollbar-thin flex-1 overflow-y-auto">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="py-8">
                        {!isDashboard && (
                            <>
                                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h1 className="text-[28px] font-bold text-gray-900">{metadata.title}</h1>
                                        <p className="mt-2 text-base text-gray-600">{metadata.description}</p>
                                    </div>
                                    <div className="border-teal/20 bg-teal/5 rounded-xl border px-5 py-3 text-right">
                                        <p className="text-teal text-sm font-medium">Registration Progress</p>
                                        <p className="text-xl font-bold text-gray-900">{progressPercent}%</p>
                                        <p className="text-xs text-gray-600">
                                            Step {currentStep} of {steps.length}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-10 flex justify-center transition-transform duration-300 hover:-translate-y-0.5">
                                    <div className="rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                                        <RegistrationStepper steps={steps} currentStep={currentStep} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="w-full">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
