import { ArrowRight, Briefcase, Cog, Construction, HardDrive, Package, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const categories = [
    { title: 'Construction Materials', icon: Construction, description: 'Building materials and supplies' },
    { title: 'Equipment & Machinery', icon: Cog, description: 'Industrial equipment solutions' },
    { title: 'Electrical & MEP', icon: HardDrive, description: 'Electrical and mechanical systems' },
    { title: 'IT & Technology', icon: Briefcase, description: 'Technology products and services' },
    { title: 'Professional Services', icon: ShieldCheck, description: 'Consulting and advisory services' },
    { title: 'Logistics & Transportation', icon: Truck, description: 'Transport and logistics services' },
    { title: 'Office Supplies', icon: Package, description: 'Office and administrative supplies' },
    { title: 'Safety Equipment', icon: ShieldCheck, description: 'Workplace safety equipment' },
    { title: 'General Services', icon: Wrench, description: 'General operational services' },
];

export default function SupplierCategories() {
    const [hoveredCategory, setHoveredCategory] = useState(-1);

    const getCardClass = (isHovered: boolean) =>
        isHovered
            ? 'border-[#00ADC5] shadow-[0_20px_40px_rgba(0,173,197,0.15)]'
            : 'border-[#e2e8f0] hover:border-[#00515F]/30 hover:shadow-[0_10px_30px_rgba(13,59,57,0.08)]';

    const getIconBgClass = (isHovered: boolean) =>
        isHovered ? 'bg-[#00515F]' : 'bg-[#F8FAFC]';

    const getIconTextClass = (isHovered: boolean) =>
        isHovered ? 'text-white' : 'text-[#00515F]';

    const getTitleClass = (isHovered: boolean) =>
        isHovered ? 'text-[#00515F]' : 'text-[#172B3A]';

    const getArrowClass = (isHovered: boolean) =>
        isHovered ? 'text-[#00515F] translate-x-1' : 'text-[#94A3B8]';

    return (
        <section id="categories" className="bg-[#F5F9F9] py-16 sm:py-20 lg:py-24">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-[#172B3A] sm:text-4xl">Explore Supplier Categories</h2>
                    <p className="mt-4 text-lg text-[#647783]">
                        Discover the products, services, and specialized areas in which EEC works with suppliers.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
                    {categories.map((category, index) => {
                        const isHovered = hoveredCategory === index;

                        return (
                            <div
                                key={category.title}
                                className={`group relative flex flex-col gap-4 rounded-3xl border p-6 transition-all duration-300 ${getCardClass(isHovered)}`}
                                onMouseEnter={() => setHoveredCategory(index)}
                                onMouseLeave={() => setHoveredCategory(-1)}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${getIconBgClass(isHovered)}`}>
                                    <category.icon className={`h-5 w-5 transition-all duration-300 ${getIconTextClass(isHovered)}`} />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${getTitleClass(isHovered)}`}>
                                        {category.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[#647783]">{category.description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4">
                                    <ArrowRight className={`h-4 w-4 transition-all duration-300 ${getArrowClass(isHovered)}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 flex justify-center">
                    <Link
                        href="/supplier-registration/categories"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[#00515F] underline underline-offset-4"
                    >
                        View All Categories <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
