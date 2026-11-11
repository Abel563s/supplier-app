import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    completion?: {
        steps: Array<{
            number: number;
            title: string;
            status: 'complete' | 'partial' | 'needs-attention' | 'not-started';
            href: string;
        }>;
        currentStep: number;
        completedSteps: number;
        totalSteps: number;
        percentage: number;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface SupplierRecord {
    id: number;
    user_id: number;
    status: string;
    [key: string]: unknown;
}

export interface ContractRecord {
    id: number;
    client_project_name: string;
    nature_similarity: string;
    contract_value: string;
    contract_date: string;
}

export interface DocumentRecord {
    id: number;
    document_type: string;
    file_name: string;
    file_size: number;
    uploaded_at?: string;
}

export interface SupplierDocumentType {
    key: string;
    label: string;
    required: boolean;
}

export interface Notification {
    id: string;
    category: string | null;
    title: string;
    body: string;
    url: string | null;
    supplier_id: number | null;
    supplier_name: string | null;
    event: string | null;
    read: boolean;
    read_at?: string | null;
    created_at: string;
}
