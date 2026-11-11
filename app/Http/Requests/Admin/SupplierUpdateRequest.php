<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SupplierUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return self::updateRules();
    }

    /**
     * @return array<string, mixed>
     */
    public static function updateRules(): array
    {
        return [
            'legal_form' => ['required', 'string', 'max:50'],
            'country_of_registration' => ['required', 'string', 'max:100'],
            'legal_name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'business_registration_no' => ['required', 'string', 'max:100'],
            'vat_registered' => ['boolean'],
            'vat_registration_no' => ['nullable', 'string', 'max:100'],
            'registered_capital' => ['required', 'integer', 'min:0'],
            'latest_annual_turnover' => ['required', 'integer', 'min:0'],
            'date_established' => ['required', 'date'],
            'trade_license_renewed_date' => ['required', 'date'],
            'primary_contact_name' => ['required', 'string', 'max:255'],
            'primary_phone' => ['required', 'string', 'max:50'],
            'alternate_phone' => ['required', 'string', 'max:50'],
            'primary_email' => ['required', 'email', 'max:255'],
            'alternate_email' => ['nullable', 'email', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'subcity' => ['required', 'string', 'max:100'],
            'woreda' => ['required', 'string', 'max:100'],
            'procurement_type' => ['required', 'array', 'min:1'],
            'procurement_type.*' => ['string', 'in:supply,service,consulting,non-consulting'],
            'primary_business_category' => ['required', 'string', 'max:255'],
            'sub_category' => ['required', 'string', 'max:255'],
            'specialization' => ['required', 'string', 'max:255'],
            'products_services_description' => ['required', 'string', 'max:2000'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_holder_name' => ['nullable', 'string', 'max:255'],
            'number_of_employees' => ['nullable', 'integer', 'min:0'],
            'technical_personnel' => ['nullable', 'integer', 'min:0'],
            'non_technical_personnel' => ['nullable', 'integer', 'min:0'],
            'tax_clearance_from' => ['required', 'date'],
            'tax_clearance_to' => ['required', 'date', 'after_or_equal:tax_clearance_from'],
            'tax_clearance_fiscal_year' => ['nullable', 'string', 'max:20'],
            'subject_to_excise_tax' => ['boolean'],
            'authorized_manufacturer_distributor' => ['boolean'],
            'signatory_title' => ['required', 'string', 'max:255'],
            'owner_ceo_name' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return self::updateMessages();
    }

    /**
     * @return array<string, string>
     */
    public static function updateMessages(): array
    {
        return [
            'legal_form.required' => 'Legal Form is required',
            'country_of_registration.required' => 'Country of Registration is required',
            'legal_name.required' => 'Company / Legal Name is required',
            'primary_contact_name.required' => 'Primary Contact Full Name is required',
            'primary_phone.required' => 'License Contact Number is required',
            'alternate_phone.required' => 'Alternate / Sales Contact Number is required',
            'subcity.required' => 'Subcity is required',
            'procurement_type.required' => 'Procurement Type is required',
            'specialization.required' => 'Specialization is required',
            'tax_clearance_from.required' => 'Tax Clearance From is required',
            'tax_clearance_to.required' => 'Tax Clearance To is required',
        ];
    }
}
