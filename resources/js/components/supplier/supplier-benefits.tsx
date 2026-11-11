import { BarChart3, FileText, ShieldCheck, Users } from 'lucide-react';

const benefits = [
    { icon: BarChart3, title: 'Business Opportunities', description: 'Gain visibility for upcoming procurement opportunities.' },
    { icon: FileText, title: 'Centralized Profile', description: 'Maintain company information and documents in one place.' },
    { icon: ShieldCheck, title: 'Transparent Process', description: 'Track your registration and evaluation status.' },
    { icon: Users, title: 'Long-Term Partnership', description: 'Build a structured relationship with EEC.' },
];

export default function SupplierBenefits() {
    return (
        <section className="relative bg-[#00515F] py-16 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#00515F_0%,_#004550_100%)]" />
            <div className="relative mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">Why Register With EEC?</h2>
                    <p className="mt-3 text-base text-white/80">Build a trusted supplier relationship through a transparent digital process.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                                <benefit.icon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-white">{benefit.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-white/80">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
