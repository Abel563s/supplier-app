import { useState } from 'react';
import { Head } from '@inertiajs/react';
import SupplierPublicLayout from '@/layouts/supplier-public-layout';
import SupplierHero from '@/components/supplier/supplier-hero';
import SupplierBenefits from '@/components/supplier/supplier-benefits';
import SupplierRequirements from '@/components/supplier/supplier-requirements';
import SupplierCategories from '@/components/supplier/supplier-categories';
import SupplierStatusCta from '@/components/supplier/supplier-status-cta';
import FinalCta from '@/components/supplier/final-cta';
import SupplierFaqModal from '@/components/supplier/supplier-faq-modal';

export default function SupplierRegistrationIndex() {
    const [faqOpen, setFaqOpen] = useState(false);

    return (
        <SupplierPublicLayout onOpenFaq={() => setFaqOpen(true)}>
            <Head title="Supplier Registration" />

            <SupplierHero onOpenFaq={() => setFaqOpen(true)} />
            <SupplierBenefits />
            <SupplierRequirements />
            <SupplierCategories />
            <SupplierStatusCta />
            <FinalCta />

            <SupplierFaqModal open={faqOpen} onOpenChange={setFaqOpen} />
        </SupplierPublicLayout>
    );
}
