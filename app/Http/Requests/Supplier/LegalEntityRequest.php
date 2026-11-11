<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class LegalEntityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'legal_form' => ['required', 'string', 'max:50'],
            'country_of_registration' => ['required', 'string', 'max:100'],
            'legal_name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:50'],
            'business_registration_no' => ['required', 'string', 'max:100'],
            'vat_registered' => ['boolean'],
            'vat_registration_no' => ['nullable', 'string', 'max:100'],
            'registered_capital' => ['required', 'integer', 'min:0'],
            'latest_annual_turnover' => ['required', 'integer', 'min:0'],
            'date_established' => ['required', 'date'],
            'trade_license_renewed_date' => ['required', 'date'],
            'tax_clearance_from' => ['required', 'date'],
            'tax_clearance_to' => ['required', 'date', 'after_or_equal:tax_clearance_from'],
            'tax_clearance_fiscal_year' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'legal_form.required' => 'Legal Form is required',
            'country_of_registration.required' => 'Country of Registration is required',
            'legal_name.required' => 'Company / Legal Name is required',
            'tin.required' => 'TIN is required',
            'business_registration_no.required' => 'Business Registration No. is required',
            'registered_capital.required' => 'Registered Capital is required',
            'latest_annual_turnover.required' => 'Latest Annual Turnover is required',
            'trade_license_renewed_date.required' => 'Trade License Renewed Date is required',
            'tax_clearance_from.required' => 'Tax Clearance From is required',
            'tax_clearance_to.required' => 'Tax Clearance To is required',
        ];
    }
}
