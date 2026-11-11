import { type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface ReviewSectionProps {
    title: string;
    editHref: string;
    children: ReactNode;
}

export default function ReviewSection({ title, editHref, children }: ReviewSectionProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <Button variant="ghost" size="sm" className="text-teal hover:bg-teal/5" asChild>
                    <Link href={editHref}>Edit</Link>
                </Button>
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}
