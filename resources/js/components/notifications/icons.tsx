import {
    AlertCircle,
    Bell,
    CheckCircle,
    ClipboardCheck,
    Clock,
    FileText,
    Info,
    Mail,
    Settings,
    Star,
    UserPlus,
    XCircle,
    type LucideProps,
} from 'lucide-react';

const categoryIcons: Record<string, React.ComponentType<LucideProps>> = {
    supplier_registration: UserPlus,
    supplier_update: FileText,
    documents: FileText,
    review_assignment: ClipboardCheck,
    grading: Star,
    approval: CheckCircle,
    rejection: XCircle,
    system_updates: Settings,
    reminders: Clock,
};

export function CategoryIcon({ category }: { category: string | null }) {
    const Icon = categoryIcons[category ?? ''] || Info;

    return <Icon className="h-5 w-5" />;
}

export const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    supplier_registration: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    supplier_update: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    documents: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    review_assignment: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    grading: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
    approval: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    rejection: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    system_updates: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' },
    reminders: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
};

export function categoryLabel(category: string | null): string {
    const labels: Record<string, string> = {
        supplier_registration: 'Supplier Registration',
        supplier_update: 'Supplier Update',
        documents: 'Documents',
        review_assignment: 'Review Assignment',
        grading: 'Grading',
        approval: 'Approval',
        rejection: 'Rejection',
        system_updates: 'System Update',
        reminders: 'Reminder',
    };

    return labels[category ?? ''] || 'Notification';
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export { AlertCircle, Bell, Mail };
