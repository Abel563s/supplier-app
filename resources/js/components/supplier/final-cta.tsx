import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function FinalCta() {
    return (
        <section className="relative bg-[#00515F] py-16 sm:py-20 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00ADC5]/[0.08] blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00515F]/[0.05] blur-[100px]" />
            </div>

            <div className="relative mx-auto w-full px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Become an EEC Supplier?</h2>
                <p className="mt-4 text-lg leading-relaxed text-[#e2e8f0] max-w-2xl mx-auto">
                    Start your supplier registration today and connect your business with EEC procurement opportunities across construction and engineering operations.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Button size="lg" className="bg-[#00ADC5] text-white hover:bg-[#00515F] h-12 px-8 text-sm font-medium shadow-lg hover:shadow-[0_0_24px_rgba(0,173,197,0.40)] transition-all duration-300" asChild>
                        <Link href="/supplier-registration/register">
                            Start Supplier Registration <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <p className="mt-8 text-sm text-[#e2e8f0]/80">
                    Already registered?{' '}
                    <Link href="/supplier-registration/login" className="font-semibold text-white hover:underline">
                        Sign in to your Supplier Portal
                    </Link>
                </p>
            </div>
        </section>
    );
}
