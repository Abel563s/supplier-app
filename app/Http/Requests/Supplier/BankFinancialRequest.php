<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class BankFinancialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['nullable', 'string', 'max:255'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_holder_name' => ['nullable', 'string', 'max:255'],
            'number_of_employees' => ['nullable', 'integer', 'min:0'],
            'technical_personnel' => ['nullable', 'integer', 'min:0'],
            'non_technical_personnel' => ['nullable', 'integer', 'min:0'],
            'tax_clearance_expiry' => ['nullable', 'date'],
            'tax_clearance_fiscal_year' => ['nullable', 'string', 'max:20'],
            'subject_to_excise_tax' => ['boolean'],
            'authorized_manufacturer_distributor' => ['boolean'],
        ];
    }
}
