import { Head } from '@inertiajs/react';
import SupplierPublicLayout from '@/layouts/supplier-public-layout';
import SupplierStatusCta from '@/components/supplier/supplier-status-cta';

export default function SupplierStatusPage() {
    return (
        <SupplierPublicLayout>
            <Head title="Registration Status" />
            <div className="py-10">
                <SupplierStatusCta />
            </div>
        </SupplierPublicLayout>
    );
}
