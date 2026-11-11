import { type ReactNode } from 'react';
import SupplierHeader from '@/components/supplier/supplier-header';
import SupplierFooter from '@/components/supplier/supplier-footer';

interface SupplierPublicLayoutProps {
    children: ReactNode;
    onOpenFaq?: () => void;
}

export default function SupplierPublicLayout({ children, onOpenFaq }: SupplierPublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[#F5F9F9] text-[#172B3A]">
            <SupplierHeader onOpenFaq={onOpenFaq} />
            <main className="flex-1">{children}</main>
            <SupplierFooter onOpenFaq={onOpenFaq} />
        </div>
    );
}
