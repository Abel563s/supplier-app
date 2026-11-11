import { Head } from '@inertiajs/react';
import SupplierPublicLayout from '@/layouts/supplier-public-layout';
import SupplierCategories from '@/components/supplier/supplier-categories';

export default function SupplierCategoriesPage() {
    return (
        <SupplierPublicLayout>
            <Head title="Supplier Categories" />
            <div className="py-10">
                <SupplierCategories />
            </div>
        </SupplierPublicLayout>
    );
}
