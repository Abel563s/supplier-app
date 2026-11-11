<?php

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class StoreProcurementRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_business_category' => ['required', 'string', 'in:Office Facilities,Direct Construction Material,Finishing,MEP,Sub contractors,Plant and Machinery,Vehicle, Spare,Consultant,Promotional,Cleaning and Security,International Suppliers'],
            'subcategory' => ['required', 'string', 'max:255'],
            'procurement_type' => ['required', 'string', 'in:supply,service,consulting,non-consulting'],
            'procurement_method' => ['required', 'string', 'in:rfq,itb,rfp'],
            'ro_number' => ['required', 'string', 'max:255'],
            'ro_document' => ['required', 'file', 'mimes:pdf', 'max:5120'],
            'tech_spec_document' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'specialization' => ['required', 'string', 'max:255'],
            'purpose_notes' => ['nullable', 'string', 'max:2000'],
            'established_before' => ['nullable', 'date'],
            'established_after' => ['nullable', 'date'],
            'minimum_capital' => ['nullable', 'integer', 'min:0'],
            'prefer_successful_suppliers' => ['boolean'],
            'require_valid_trade_license' => ['boolean'],
            'require_tax_clearance' => ['boolean'],
            'require_business_registration' => ['boolean'],
            'require_tin_certificate' => ['boolean'],
            'require_vat_registration_certificate' => ['boolean'],
            'require_egp_registration_letter' => ['boolean'],
            'vat_exempt_procurement' => ['boolean'],
            'require_excise_tax' => ['boolean'],
            'require_audited_financial_statements' => ['boolean'],
            'require_manufacturer_authorization' => ['boolean'],
            'minimum_similar_contracts' => ['nullable', 'integer', 'min:0'],
            'look_back_years' => ['nullable', 'integer', 'min:0'],
            'minimum_contract_value' => ['nullable', 'integer', 'min:0'],
            'minimum_annual_turnover' => ['nullable', 'integer', 'min:0'],
            'production_capacity_multiple' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'primary_business_category.required' => 'Primary Business Category is required',
            'procurement_type.required' => 'Procurement Type is required',
            'subcategory.required' => 'Sub-category is required',
            'procurement_method.required' => 'Procurement Method is required',
            'procurement_method.in' => 'Selected Procurement Method is invalid',
            'ro_number.required' => 'RO Number is required',
            'ro_document.required' => 'RO Document is required',
            'ro_document.file' => 'RO Document must be a file.',
            'ro_document.mimes' => 'RO Document must be a PDF file.',
            'ro_document.max' => 'RO Document may not exceed 5120 kilobytes.',
            'tech_spec_document.file' => 'Technical Specification must be a file.',
            'tech_spec_document.mimes' => 'Technical Specification must be a PDF file.',
            'tech_spec_document.max' => 'Technical Specification may not exceed 5120 kilobytes.',
            'specialization.required' => 'Specialization is required',
        ];
    }
}
