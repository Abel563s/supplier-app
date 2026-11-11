import AdminLayout from '@/layouts/admin/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarDays, Download, FileText, LoaderCircle, Printer, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface LetterSupplier {
    id: number;
    legal_name: string;
    trade_name: string;
    primary_business_category: string;
    sub_category: string | null;
    procurement_type: string;
    registered_capital: number | null;
    latest_annual_turnover: number | null;
    contracts_count: number;
    city: string | null;
    subcity: string | null;
    woreda: string | null;
    country_of_registration: string | null;
    primary_contact_name: string | null;
    primary_phone: string | null;
    alternate_phone: string | null;
    primary_email: string | null;
    date_established: string | null;
    business_registration_no: string | null;
    tin: string | null;
}

interface LetterRequest {
    number: string;
    procurement_type: string;
    primary_business_category: string;
    subcategory: string | null;
    purpose_notes: string | null;
    submitted_at: string | null;
}

interface ProcurementRequestLetterProps {
    request: LetterRequest;
    suppliers: LetterSupplier[];
}

const procurementTypeLabel = (type: string) => (type === 'supply' ? 'Supply' : type === 'service' ? 'Service' : type);

const formatDate = (date: string | null) => {
    if (!date) {
        return '-';
    }

    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const pdfPalette = {
    default: '#1f2937',
    white: '#ffffff',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray900: '#111827',
    teal: '#00515F',
    border: '#e5e7eb',
    muted: '#f8fafc',
};

function sanitizePdfColors(clonedDocument: Document): void {
    const letter = clonedDocument.querySelector<HTMLElement>('[data-letter-document]');

    if (!letter) {
        throw new Error('The letter could not be prepared for PDF export.');
    }

    const printableElements = [letter, ...Array.from(letter.querySelectorAll<HTMLElement>('*'))];

    printableElements.forEach((element) => {
        const classes = element.classList;

        const textColor = classes.contains('text-white')
            ? pdfPalette.white
            : classes.contains('text-dark-teal') || classes.contains('text-teal')
              ? pdfPalette.teal
              : classes.contains('text-gray-500')
                ? pdfPalette.gray500
                : classes.contains('text-gray-600')
                  ? pdfPalette.gray600
                  : classes.contains('text-gray-700')
                    ? pdfPalette.gray700
                    : classes.contains('text-gray-900')
                      ? pdfPalette.gray900
                      : pdfPalette.default;

        const backgroundColor =
            element.dataset.pdfBackground === 'muted'
                ? pdfPalette.muted
                : element.dataset.pdfBackground === 'white'
                  ? pdfPalette.white
                  : 'transparent';

        // Tailwind v4 emits oklch()/color-mix() colours, which html2canvas cannot
        // parse, so every colour-bearing property is forced to a plain value.
        element.style.setProperty('color', textColor, 'important');
        element.style.setProperty('background-color', backgroundColor, 'important');
        element.style.setProperty('background-image', 'none', 'important');
        element.style.setProperty('border-color', pdfPalette.border, 'important');
        element.style.setProperty('border-top-color', pdfPalette.border, 'important');
        element.style.setProperty('border-right-color', pdfPalette.border, 'important');
        element.style.setProperty('border-bottom-color', pdfPalette.border, 'important');
        element.style.setProperty('border-left-color', pdfPalette.border, 'important');
        element.style.setProperty('outline-color', 'transparent', 'important');
        element.style.setProperty('text-decoration-color', textColor, 'important');
        element.style.setProperty('column-rule-color', pdfPalette.border, 'important');
        element.style.setProperty('box-shadow', 'none', 'important');
        element.style.setProperty('text-shadow', 'none', 'important');
    });
}

export default function ProcurementRequestLetter({ request, suppliers }: ProcurementRequestLetterProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const today = formatDate(new Date().toISOString());
    const procurementType = procurementTypeLabel(request.procurement_type);
    const requestNumber = request.number;
    const requestId = request.number.replace('PR-', '');
    const supplierRows = suppliers.map((supplier) => ({
        supplier,
        location: [supplier.city, supplier.subcity, supplier.woreda, supplier.country_of_registration].filter(Boolean).join(', '),
    }));

    async function downloadPdf(): Promise<void> {
        setIsDownloading(true);
        setDownloadError(null);
        let temporaryPdfStyles: HTMLStyleElement | null = null;

        try {
            const letter = document.querySelector<HTMLElement>('[data-letter-document]');

            if (!letter) {
                throw new Error('The letter could not be found.');
            }

            const html2pdf = (await import('html2pdf.js')).default;
            const filename = `${requestNumber}-LETTER.pdf`;

            temporaryPdfStyles = document.createElement('style');
            temporaryPdfStyles.textContent = '*::before, *::after { content: none !important; }';
            document.head.append(temporaryPdfStyles);

            await html2pdf()
                .set({
                    margin: 10,
                    filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        onclone: sanitizePdfColors,
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'], avoid: ['.letter-details', '.letter-footer'] },
                })
                .from(letter)
                .save();
        } catch (error) {
            console.error('Unable to download supplier letter PDF.', error);
            setDownloadError('The PDF could not be generated. Please try again or use Print Letter and choose Save as PDF.');
        } finally {
            temporaryPdfStyles?.remove();
            setIsDownloading(false);
        }
    }

    return (
        <AdminLayout>
            <Head title={`Supplier Letter - ${requestNumber}`} />

            <div className="letter-page mx-auto w-full max-w-[1440px] space-y-7 pb-10">
                <div className="no-print flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href={`/proc/requests/${requestId}`}
                        className="hover:text-dark-teal inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to request
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                        >
                            <Printer className="h-4 w-4" />
                            Print Letter
                        </button>
                        <button
                            type="button"
                            onClick={downloadPdf}
                            disabled={isDownloading}
                            className="bg-dark-teal inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003f49] disabled:cursor-wait disabled:opacity-70"
                        >
                            {isDownloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {isDownloading ? 'Preparing PDF…' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {downloadError && (
                    <div role="alert" className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {downloadError}
                    </div>
                )}

                <div className="no-print overflow-hidden rounded-2xl bg-[#00515F] text-white shadow-sm">
                    <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                                <FileText className="h-6 w-6 text-[#8de1e9]" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Supplier selection letter</h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Approved supplier
                                    </span>
                                </div>
                                <p className="mt-1.5 text-sm text-white/70">
                                    Prepared for <span className="font-semibold text-white">{suppliers.length} approved suppliers</span> ·{' '}
                                    {requestNumber}
                                </p>
                            </div>
                        </div>
                        <p className="max-w-sm text-sm leading-6 text-white/70 lg:text-right">
                            Review the official letter below. Print on A4 paper or download a PDF copy for your records.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <CalendarDays className="h-4 w-4 shrink-0 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Issued</p>
                                <p className="mt-0.5 text-sm font-semibold">{today}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <Building2 className="h-4 w-4 shrink-0 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Procurement</p>
                                <p className="mt-0.5 text-sm font-semibold">{procurementType}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
                            <FileText className="h-4 w-4 shrink-0 text-[#8de1e9]" />
                            <div>
                                <p className="text-[11px] font-medium tracking-wider text-white/50 uppercase">Reference</p>
                                <p className="mt-0.5 text-sm font-semibold">
                                    {requestNumber}/LTR
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="letter-content-grid grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="letter-preview-shell min-w-0 overflow-x-auto rounded-2xl bg-slate-200/70 p-3 sm:p-6">
                        <div
                            data-letter-document
                            data-pdf-background="white"
                            className="letter-container mx-auto w-full max-w-[210mm] rounded-md border border-gray-200 bg-white shadow-[0_12px_48px_rgba(15,23,42,0.12)]"
                        >
                            <div className="p-6 sm:p-10 lg:p-12">
                                <div className="border-dark-teal/15 flex items-start justify-between gap-4 border-b-2 pb-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <img src="/logo/EEC icon.png" alt="EEC Logo" className="h-12 w-auto shrink-0" />
                                        <div>
                                            <h2 className="text-dark-teal text-base leading-snug font-bold sm:text-lg">
                                                Ethiopian Engineering Corporation
                                            </h2>
                                            <p className="mt-1 text-xs font-medium tracking-[0.14em] text-gray-500 uppercase">Procurement Department</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right text-xs leading-5 text-gray-600 sm:text-sm">
                                        <p className="font-semibold tracking-wide text-gray-500 uppercase">Reference</p>
                                        <p className="font-semibold text-gray-900">
                                            {requestNumber}/LTR
                                        </p>
                                        <p className="mt-2 font-semibold tracking-wide text-gray-500 uppercase">Date</p>
                                        <p className="font-medium text-gray-900">{today}</p>
                                    </div>
                                </div>

                                <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.16em] text-gray-500 uppercase">To</p>
                                        <p className="mt-1.5 text-base font-bold text-gray-900">Approved Suppliers — {requestNumber}</p>
                                        <p className="mt-0.5 text-sm text-gray-600">
                                            {suppliers.length} approved supplier{suppliers.length === 1 ? '' : 's'} for this request
                                        </p>
                                    </div>
                                    <span className="bg-teal/10 text-dark-teal w-fit rounded-full px-3 py-1.5 text-xs font-semibold">
                                        Official notification
                                    </span>
                                </div>

                                <div data-pdf-background="muted" className="border-teal mt-6 rounded-r-lg border-l-4 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-bold tracking-[0.14em] text-gray-500 uppercase">Subject</p>
                                    <p className="mt-1 text-sm leading-6 font-bold text-gray-900">
                                        Supplier Selection Notification — {requestNumber} ({procurementType})
                                    </p>
                                </div>

                                <div className="mt-6 space-y-3 text-sm leading-6 text-gray-700">
                                    <p className="font-semibold text-gray-900">Dear Approved Supplier,</p>
                                    <p>
                                        Ethiopian Engineering Corporation (EEC) hereby informs you that your company has been selected as a qualified
                                        supplier for request <strong className="text-gray-900">{requestNumber}</strong> under the{' '}
                                        <strong className="text-gray-900">{procurementType}</strong> category. This letter is issued to the{' '}
                                        {suppliers.length} approved suppliers listed below and may be printed for seal and signature.
                                    </p>
                                    {request.purpose_notes && (
                                        <p>
                                            <strong className="text-gray-900">Project description:</strong> {request.purpose_notes}
                                        </p>
                                    )}
                                </div>

                                <section
                                    data-pdf-background="muted"
                                    className="letter-details mt-7 rounded-xl border border-gray-200 bg-slate-50 p-4 sm:p-5"
                                >
                                    <div className="mb-4 flex items-center gap-2.5">
                                        <div data-pdf-background="white" className="text-dark-teal flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Company details</h3>
                                            <p className="text-xs text-gray-500">Approved suppliers for this request</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">No.</th>
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">Company name</th>
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">TIN</th>
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">License contact no.</th>
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">Alternate / sales no.</th>
                                                    <th className="py-2 pr-3 font-semibold tracking-wider text-gray-500 uppercase">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200/70">
                                                {supplierRows.map((row, index) => (
                                                    <tr key={row.supplier.id} className="align-top">
                                                        <td className="py-2.5 pr-3 text-gray-500">{index + 1}</td>
                                                        <td className="py-2.5 pr-3 font-medium text-gray-900">
                                                            {row.supplier.legal_name}
                                                            {row.supplier.trade_name && row.supplier.trade_name !== row.supplier.legal_name && (
                                                                <span className="block font-normal text-gray-500">{row.supplier.trade_name}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 pr-3 text-gray-700">{row.supplier.tin || '-'}</td>
                                                        <td className="py-2.5 pr-3 text-gray-700">{row.supplier.primary_phone || '-'}</td>
                                                        <td className="py-2.5 pr-3 text-gray-700">{row.supplier.alternate_phone || '-'}</td>
                                                        <td className="py-2.5 pr-3 text-gray-700">{row.location || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <div className="letter-footer mt-7 flex flex-col gap-7 border-t border-gray-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="max-w-md text-xs leading-5 text-gray-500">
                                        <p className="font-semibold text-gray-700">Issued electronically by the Procurement Department.</p>
                                        <p>
                                            This letter does not require a physical signature. For verification, contact Ethiopian Engineering
                                            Corporation.
                                        </p>
                                    </div>
                                    <div className="w-48 text-left sm:text-right">
                                        <p className="text-sm font-bold text-gray-900">Authorized signature</p>
                                        <div className="mt-8 border-b border-gray-400" />
                                        <p className="mt-1.5 text-xs text-gray-500">Procurement Officer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="no-print space-y-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="bg-teal/10 text-dark-teal flex h-8 w-8 items-center justify-center rounded-lg">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-900">Request summary</h2>
                            </div>
                            <dl className="mt-5 space-y-4">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Request number</dt>
                                    <dd className="mt-1 text-sm font-semibold text-gray-900">{requestNumber}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Procurement type</dt>
                                    <dd className="mt-1 text-sm font-semibold text-gray-900">{procurementType}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Requested category</dt>
                                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                                        {request.primary_business_category}
                                        {request.subcategory && <span className="block font-normal text-gray-600">{request.subcategory}</span>}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Approved suppliers</dt>
                                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                                        {suppliers.map((supplier) => supplier.legal_name).join(', ')}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="border-teal/20 bg-teal/5 rounded-2xl border p-5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="text-dark-teal mt-0.5 h-5 w-5 shrink-0" />
                                <div>
                                    <h2 className="text-dark-teal text-sm font-bold">Ready to issue</h2>
                                    <p className="mt-1.5 text-xs leading-5 text-gray-600">
                                        This notification covers every approved supplier listed above. Check the company details before printing or
                                        sharing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}
