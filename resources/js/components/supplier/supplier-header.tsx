import { useEffect, useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface SupplierHeaderProps {
    onOpenFaq?: () => void;
}

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
        >
            {label}
        </Link>
    );
}

function NavButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
        >
            {label}
        </button>
    );
}

export default function SupplierHeader({ onOpenFaq }: SupplierHeaderProps) {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur transition-shadow ${
                scrolled ? 'shadow-sm' : ''
            }`}
        >
            <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href={route('home')} className="flex items-center gap-2">
                    <img src="/logo/EEC-logo.jpg" alt="EEC Logo" className="h-9 w-auto rounded-lg" />
                    <div className="leading-tight">
                        <span className="block text-sm font-semibold text-gray-900">EEC</span>
                        <span className="block text-[11px] font-medium text-gray-500 -mt-0.5">Supplier Portal</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-3 md:flex">
                    <NavLink
                        href="#process"
                        label="Registration Process"
                    />
                    <NavButton
                        onClick={() => {
                            const el = document.getElementById('requirements');
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                window.location.href = '/supplier-registration/requirements';
                            }
                        }}
                        label="Requirements"
                    />
                    <NavLink
                        href="#categories"
                        label="Categories"
                    />
                    <NavLink
                        href="/contact"
                        label="Contact"
                    />
                    <NavButton
                        onClick={onOpenFaq}
                        label="FAQs"
                    />
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Button
                        className="relative overflow-hidden bg-[#00515F] text-white hover:bg-[#00ADC5] transition-all duration-300 ease-in-out group"
                        asChild
                    >
                        <Link href="/supplier-registration/login">
                            <span className="relative overflow-hidden inline-flex items-center gap-1 px-5 py-1.5 text-sm font-medium transition-colors duration-300 group-hover:text-white">
                                <span className="relative z-10 inline-flex items-center gap-1">
                                    Supplier Login
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                                <span className="absolute inset-0 w-full h-full bg-[#00ADC5] translate-x-[-105%] transition-transform duration-500 ease-out group-hover:translate-x-0 -z-10" />
                            </span>
                        </Link>
                    </Button>
                    <Button
                        className="relative overflow-hidden bg-[#00515F] text-white hover:bg-[#00ADC5] transition-all duration-300 ease-in-out group"
                        asChild
                    >
                        <Link href="/admin/login">
                            <span className="relative overflow-hidden inline-flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-300 group-hover:text-white">
                                <span className="relative z-10 inline-flex items-center gap-1">
                                    EEC Portal
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                                <span className="absolute inset-0 w-full h-full bg-[#00ADC5] translate-x-[-105%] transition-transform duration-500 ease-out group-hover:translate-x-0 -z-10" />
                            </span>
                        </Link>
                    </Button>
                </div>

                <button
                    type="button"
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-50 md:hidden"
                    onClick={() => setOpen(!open)}
                    aria-label="Toggle navigation menu"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open && (
                <div className="border-t border-gray-100 bg-white md:hidden">
                    <nav className="flex flex-col gap-1 px-4 py-4">
                        <Link
                            href="#process"
                            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => setOpen(false)}
                        >
                            Registration Process
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                const el = document.getElementById('requirements');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    window.location.href = '/supplier-registration/requirements';
                                }
                            }}
                            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5 text-left"
                        >
                            Requirements
                        </button>
                        <Link
                            href="#categories"
                            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => setOpen(false)}
                        >
                            Categories
                        </Link>
                        <Link
                            href="/contact"
                            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => setOpen(false)}
                        >
                            Contact
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onOpenFaq?.();
                            }}
                            className="relative px-4 py-2 rounded-xl text-sm font-medium text-[#172B3A] transition-all duration-300 bg-white/50 border-transparent hover:bg-[#F5F9F9] hover:border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5 text-left"
                        >
                            FAQs
                        </button>
                        <Button
                            className="mt-2 w-full relative overflow-hidden bg-[#00515F] text-white hover:bg-[#00ADC5] transition-all duration-300 ease-in-out group"
                            asChild
                        >
                            <Link href="/supplier-registration/login">
                                <span className="relative overflow-hidden inline-flex items-center justify-center gap-1 px-5 py-2 text-sm font-medium transition-colors duration-300 group-hover:text-white">
                                    <span className="relative z-10 inline-flex items-center gap-1">
                                        Supplier Login
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                    <span className="absolute inset-0 w-full h-full bg-[#00ADC5] translate-x-[-105%] transition-transform duration-500 ease-out group-hover:translate-x-0 -z-10" />
                                </span>
                            </Link>
                        </Button>
                        <Button
                            className="mt-2 w-full relative overflow-hidden bg-[#00515F] text-white hover:bg-[#00ADC5] transition-all duration-300 ease-in-out group"
                            asChild
                        >
                            <Link href="/admin/login">
                                <span className="relative overflow-hidden inline-flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-300 group-hover:text-white">
                                    <span className="relative z-10 inline-flex items-center gap-1">
                                        EEC Portal
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                    <span className="absolute inset-0 w-full h-full bg-[#00ADC5] translate-x-[-105%] transition-transform duration-500 ease-out group-hover:translate-x-0 -z-10" />
                                </span>
                            </Link>
                        </Button>
                    </nav>
                </div>
            )}
        </header>
    );
}

