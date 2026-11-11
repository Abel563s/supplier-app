import { Head } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import { Button } from '@/components/ui/button';

export default function Submitted() {
    return (
        <SupplierLayout currentStep={7}>
            <Head title="Registration Submitted" />

            <div className="mx-auto max-w-[600px] py-16">
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                        <CheckCircle2 className="h-8 w-8 text-teal" />
                    </div>
                    <h1 className="mt-6 text-2xl font-bold text-gray-900">Registration Submitted</h1>
                    <p className="mt-4 text-gray-600">
                        Your supplier registration has been submitted successfully. Our team will review your application and get back to you soon.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button asChild>
                            <a href="/supplier">Go to Dashboard</a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/">Back to Home</a>
                        </Button>
                    </div>
                </div>
            </div>
        </SupplierLayout>
    );
}
