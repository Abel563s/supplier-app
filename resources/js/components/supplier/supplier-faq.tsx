import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    { question: 'How long does supplier registration take?', answer: 'The online registration process typically takes 10–15 minutes. Document review and evaluation may take additional time depending on completeness of your submission.' },
    { question: 'What documents do I need?', answer: 'You will need a valid business license, Tax Identification Number, VAT registration certificate if applicable, company profile, and relevant professional certificates. See the Requirements section for the full list.' },
    { question: 'Can I save my registration and continue later?', answer: 'Yes, you can save your progress and return to complete your registration at any time.' },
    { question: 'Can I update my information after registration?', answer: 'Yes, you can update your profile and upload additional documents through your supplier account at any time.' },
    { question: 'How can I track my application?', answer: 'You can track your registration status in real time through your supplier account or by using the tracking tool on this page.' },
    { question: 'What file types are accepted?', answer: 'Accepted file formats are PDF, JPG and PNG. Each file must not exceed 5 MB.' },
];

export default function SupplierFaq() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="relative bg-[#00515F] py-16 sm:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#00515F_0%,_#004550_100%)]" />
            <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">Frequently Asked Questions</h2>
                    <p className="mt-3 text-base text-white/80">Everything you need to know about supplier registration.</p>
                </div>

                <div className="mt-10 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
                    {faqs.map((faq, index) => (
                        <div key={faq.question}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between px-6 py-5 text-left"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                aria-expanded={openIndex === index}
                            >
                                <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-5 text-sm leading-relaxed text-gray-600">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
