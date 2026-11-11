import { ShieldCheck, ClipboardCheck, SearchCheck, Lock } from 'lucide-react';

const trustItems = [
    { icon: ShieldCheck, label: 'Secure Registration' },
    { icon: ClipboardCheck, label: 'Transparent Evaluation' },
    { icon: SearchCheck, label: 'Centralized Profile' },
    { icon: Lock, label: 'Application Tracking' },
];

export default function TrustStrip() {
    return (
        <section className="relative bg-[#00515F]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00515F_0%,#00515F_70%,#004550_100%)]" />
            <div className="relative mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-center gap-8 py-6 sm:gap-12">
                    {trustItems.map((item) => (
                        <span key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-white">
                            <item.icon className="h-4 w-4 text-white" />
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
