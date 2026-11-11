<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Letter - {{ $request['number'] }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
            color: #111827;
            background: white;
            padding: 0;
            margin: 0;
        }

        .letter-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
        }

        .letter-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }

        .letter-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .letter-header-left img {
            height: 48px;
            width: auto;
        }

        .letter-header-left h2 {
            font-size: 18px;
            font-weight: 700;
            color: #00515F;
        }

        .letter-header-left p {
            font-size: 12px;
            color: #6b7280;
        }

        .letter-header-right {
            text-align: right;
            font-size: 14px;
            color: #6b7280;
        }

        .letter-header-right p {
            margin-bottom: 2px;
        }

        .letter-recipient {
            margin-bottom: 16px;
        }

        .letter-recipient p {
            font-size: 14px;
            margin-bottom: 2px;
        }

        .letter-recipient .label {
            font-weight: 600;
            color: #111827;
        }

        .letter-subject {
            margin-bottom: 24px;
        }

        .letter-subject p {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }

        .letter-body {
            margin-bottom: 32px;
        }

        .letter-body p {
            font-size: 14px;
            line-height: 1.7;
            color: #374151;
            margin-bottom: 12px;
        }

        .company-details {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #f9fafb;
            margin-bottom: 32px;
        }

        .company-details h3 {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }

        .company-details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        .company-details-table th,
        .company-details-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
        }

        .company-details-table th {
            background: #f3f4f6;
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .company-details-table td {
            color: #111827;
        }

        .company-details-table td.number {
            color: #6b7280;
            text-align: center;
        }

        .letter-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }

        .letter-footer-left {
            font-size: 12px;
            color: #9ca3af;
            max-width: 60%;
        }

        .letter-footer-left p {
            margin-bottom: 4px;
        }

        .letter-footer-right {
            text-align: right;
        }

        .letter-footer-right .label {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
        }

        .signature-line {
            width: 120px;
            height: 40px;
            border-bottom: 1px solid #9ca3af;
            margin-bottom: 4px;
        }

        .letter-footer-right .title {
            font-size: 12px;
            color: #9ca3af;
        }

        @media print {
            body {
                background: white;
            }

            .letter-container {
                max-width: none;
                padding: 0;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="letter-container">
        <div class="letter-header">
            <div class="letter-header-left">
                <img src="{{ asset('logo/EEC icon.png') }}" alt="EEC Logo">
                <div>
                    <h2>Ethiopian Engineering Corporation</h2>
                    <p>Procurement Department</p>
                </div>
            </div>
            <div class="letter-header-right">
                <p><strong>Ref. No</strong></p>
                <p>{{ $request['number'] }}/LTR</p>
                <p style="margin-top: 8px;"><strong>Date</strong></p>
                <p>{{ date('d F Y') }}</p>
            </div>
        </div>

        <div class="letter-recipient">
            <p class="label">To:</p>
            <p>Approved Suppliers &mdash; {{ $request['number'] }}</p>
            <p>{{ count($suppliers) }} approved supplier{{ count($suppliers) === 1 ? '' : 's' }} for this request</p>
        </div>

        <div class="letter-subject">
            <p>Subject: Supplier Selection Notification - {{ $request['number'] }} ({{ ucfirst($request['procurement_type']) }})</p>
        </div>

        <div class="letter-body">
            <p>Dear Approved Supplier,</p>

            <p>
                Ethiopian Engineering Corporation (EEC) hereby informs you that your company has been selected as a qualified supplier for request <strong>{{ $request['number'] }}</strong> under the <strong>{{ ucfirst($request['procurement_type']) }}</strong> category. This letter is issued to the {{ count($suppliers) }} approved suppliers listed below and may be printed for seal and signature.
            </p>

            @if($request['purpose_notes'])
                <p>
                    <strong>Project Description:</strong> {{ $request['purpose_notes'] }}
                </p>
            @endif
        </div>

        <div class="company-details">
            <h3>Company Details</h3>
            <table class="company-details-table">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">No.</th>
                        <th>Company Name</th>
                        <th>TIN</th>
                        <th>License Contact Number</th>
                        <th>Alternate / Sales No.</th>
                        <th style="min-width: 130px;">Location</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($suppliers as $index => $supplier)
                        <tr>
                            <td class="number">{{ $index + 1 }}</td>
                            <td>
                                {{ $supplier['legal_name'] }}
                                @if($supplier['trade_name'] && $supplier['trade_name'] !== $supplier['legal_name'])
                                    <br><span style="color: #6b7280;">{{ $supplier['trade_name'] }}</span>
                                @endif
                            </td>
                            <td>{{ $supplier['tin'] ?? '-' }}</td>
                            <td>{{ $supplier['primary_phone'] ?? '-' }}</td>
                            <td>{{ $supplier['alternate_phone'] ?? '-' }}</td>
                            <td>
                                {{ collect([$supplier['city'], $supplier['subcity'], $supplier['woreda'], $supplier['country_of_registration']])->filter()->join(', ') ?: '-' }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="letter-footer">
            <div class="letter-footer-left">
                <p>This letter is generated electronically and does not require a physical signature.</p>
                <p>For verification, contact Ethiopian Engineering Corporation - Procurement Department.</p>
            </div>
            <div class="letter-footer-right">
                <p class="label">Authorized Signature</p>
                <div class="signature-line"></div>
                <p class="title">Procurement Officer</p>
            </div>
        </div>
    </div>
</body>
</html>
