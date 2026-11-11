import { usePage } from '@inertiajs/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlashData {
    success?: string | null;
    error?: string | null;
}

export default function FlashMessages() {
    const { props } = usePage();
    const flash = props.flash as FlashData | undefined;
    const message = flash?.success || flash?.error || '';
    const variant = flash?.error ? 'error' : 'success';
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!flash?.success && !flash?.error) {
            setVisible(false);

            return;
        }

        setVisible(true);

        const timer = window.setTimeout(() => setVisible(false), 6000);

        return () => window.clearTimeout(timer);
    }, [flash]);

    if (!message || !visible) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div
                role="status"
                aria-live="polite"
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur ${
                    variant === 'error'
                        ? 'border-red-200 bg-red-50/95 text-red-900'
                        : 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
                }`}
            >
                {variant === 'error' ? (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                )}
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => setVisible(false)}
                    className="rounded-lg p-1 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
