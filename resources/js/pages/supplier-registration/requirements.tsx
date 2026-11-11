import { Head } from '@inertiajs/react';
import SupplierPublicLayout from '@/layouts/supplier-public-layout';
import SupplierRequirements from '@/components/supplier/supplier-requirements';

export default function SupplierRequirementsPage() {
    return (
        <SupplierPublicLayout>
            <Head title="Supplier Requirements" />
            <div className="py-10">
                <SupplierRequirements />
            </div>
        </SupplierPublicLayout>
    );
}
