import { ShieldCheck } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface SupplierFooterProps {
    onOpenFaq?: () => void;
}

export default function SupplierFooter({ onOpenFaq }: SupplierFooterProps) {
    return (
        <footer className="bg-[#172B3A] border-t border-[#2c4050]">
            <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00515F]">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="leading-tight text-left">
                                <span className="block text-sm font-bold text-white">EEC</span>
                                <span className="block text-[11px] font-medium text-[#94A3B8] -mt-0.5">Supplier Portal</span>
                            </div>
                        </Link>
                        <p className="mt-5 text-sm leading-relaxed text-[#94A3B8]">
                            A trusted digital platform for supplier registration and procurement engagement.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Supplier Portal</h4>
                        <ul className="mt-5 space-y-3">
                            <li><Link href="/supplier-registration/register" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Registration</Link></li>
                            <li><Link href="/supplier-registration/requirements" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Requirements</Link></li>
                            <li><Link href="/supplier-registration/categories" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Categories</Link></li>
                            <li><Link href="/supplier-registration/login" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Supplier Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Support</h4>
                        <ul className="mt-5 space-y-3">
                            <li><button type="button" onClick={onOpenFaq} className="text-left text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">FAQs</button></li>
                            <li><Link href="/contact" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal</h4>
                        <ul className="mt-5 space-y-3">
                            <li><Link href="/privacy-policy" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms-and-conditions" className="text-sm text-[#94A3B8] hover:text-[#00ADC5] transition-colors">Terms & Conditions</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-14 border-t border-[#2c4050] pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#647783]">© 2026 EEC. All rights reserved.</p>
                    <p className="text-xs text-[#647783]">Supplier Registration Portal</p>
                </div>
            </div>
        </footer>
    );
}
