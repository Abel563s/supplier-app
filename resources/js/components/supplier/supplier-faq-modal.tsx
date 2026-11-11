import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';

const faqs = [
    { question: 'How long does supplier registration take?', answer: 'The online registration process typically takes 10–15 minutes. Document review and evaluation may take additional time depending on completeness of your submission.' },
    { question: 'What documents do I need?', answer: 'You will need a valid business license, Tax Identification Number, VAT registration certificate if applicable, company profile, and relevant professional certificates. See the Requirements section for the full list.' },
    { question: 'Can I save my registration and continue later?', answer: 'Yes, you can save your progress and return to complete your registration at any time.' },
    { question: 'Can I update my information after registration?', answer: 'Yes, you can update your profile and upload additional documents through your supplier account at any time.' },
    { question: 'How can I track my application?', answer: 'You can track your registration status in real time through your supplier account or by using the tracking tool on this page.' },
    { question: 'What file types are accepted?', answer: 'Accepted file formats are PDF, JPG and PNG. Each file must not exceed 5 MB.' },
];

interface SupplierFaqModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SupplierFaqModal({ open, onOpenChange }: SupplierFaqModalProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Frequently Asked Questions</DialogTitle>
                    <DialogDescription>Everything you need to know about supplier registration.</DialogDescription>
                </DialogHeader>

                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                    {faqs.map((faq, index) => (
                        <div key={faq.question}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between px-6 py-4 text-left"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                aria-expanded={openIndex === index}
                            >
                                <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
