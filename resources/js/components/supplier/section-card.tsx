import { ArrowRight, CheckCircle2, Circle, CircleDot, AlertCircle, FileText, User, Tag, CreditCard, UserCheck, Upload, FileCheck } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';

type SectionStatus = 'completed' | 'in-progress' | 'not-started' | 'needs-attention';

interface SectionCardProps {
    number: number;
    title: string;
    description: string;
    status: SectionStatus;
    href: string;
    progress?: number;
}

const stepIcons: Record<number, typeof FileText> = {
    1: FileText,
    2: User,
    3: Tag,
    4: CreditCard,
    5: UserCheck,
    6: Upload,
    7: FileCheck,
};

export default function SectionCard({ number, title, description, status, href, progress }: SectionCardProps) {
    const statusConfig = {
        completed: {
            icon: CheckCircle2,
            badge: 'Completed',
            badgeClass: 'bg-teal/10 text-teal',
            cardClass: 'border-teal/20 bg-white hover:border-teal/40 hover:shadow-lg',
            iconClass: 'text-teal',
            iconBg: 'bg-teal/10',
        },
        'in-progress': {
            icon: CircleDot,
            badge: 'In Progress',
            badgeClass: 'bg-teal/10 text-teal',
            cardClass: 'border-teal/40 bg-white hover:border-teal/60 hover:shadow-lg',
            iconClass: 'text-teal',
            iconBg: 'bg-teal/10',
        },
        'not-started': {
            icon: Circle,
            badge: 'Not Started',
            badgeClass: 'bg-gray-100 text-gray-600',
            cardClass: 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md',
            iconClass: 'text-gray-400',
            iconBg: 'bg-gray-100',
        },
        'needs-attention': {
            icon: AlertCircle,
            badge: 'Needs Attention',
            badgeClass: 'bg-amber-50 text-amber-700',
            cardClass: 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-lg',
            iconClass: 'text-amber-500',
            iconBg: 'bg-amber-50',
        },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const StepIcon = stepIcons[number] || FileText;

    return (
        <Link href={href}>
            <div
                className={`group flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 ${config.cardClass}`}
            >
                <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg}`}>
                        <StepIcon className={`h-5 w-5 ${config.iconClass}`} />
                    </div>
                    <Badge variant="secondary" className={config.badgeClass}>
                        {config.badge}
                    </Badge>
                </div>

                <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <p className="mt-1 text-xs text-gray-600">{description}</p>
                </div>

                {progress !== undefined && status === 'in-progress' && (
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-teal transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">{progress}%</span>
                    </div>
                )}

                <div className="mt-4 flex items-center text-teal">
                    <span className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">Continue</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}
