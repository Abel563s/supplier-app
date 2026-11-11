import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FormSectionProps {
    children: ReactNode;
    onBack?: string;
    onSubmit?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
    onNext?: () => void;
    nextLabel?: string;
    isNextSubmitting?: boolean;
    disabled?: boolean;
}

export default function FormSection({
    children,
    onBack,
    onSubmit,
    submitLabel = 'Continue',
    isSubmitting = false,
    onNext,
    nextLabel,
    isNextSubmitting = false,
    disabled = false,
}: FormSectionProps) {
    const primaryLabel = nextLabel || submitLabel;
    const handleClick = onNext || onSubmit;
    const showPrimary = Boolean(handleClick);
    const submitting = isNextSubmitting || isSubmitting;

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center justify-between">
                {onBack && (
                    <Link
                        href={onBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-teal"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                )}
            </div>

            <Separator className="bg-gray-200" />

            <div className="space-y-6">
                {children}
            </div>

            {showPrimary && (
                <div className="flex items-center justify-center border-t border-gray-200 pt-6">
                    <Button onClick={handleClick} disabled={submitting || disabled} className="bg-[#00515F] text-white hover:bg-[#00515F]/90 h-11 px-8 text-sm font-medium">
                        {submitting ? 'Saving...' : primaryLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}
