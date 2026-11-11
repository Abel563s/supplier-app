<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class BusinessScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'procurement_type' => ['required', 'array', 'min:1'],
            'procurement_type.*' => ['string', 'in:supply,service,consulting,non-consulting'],
            'primary_business_category' => ['required', 'string', 'max:255'],
            'sub_category' => ['required', 'string', 'max:255'],
            'specialization' => ['required', 'string', 'max:255'],
            'products_services_description' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'procurement_type.required' => 'Procurement Type is required',
            'procurement_type.*.in' => 'Selected Procurement Type is invalid',
            'primary_business_category.required' => 'Primary Business Category is required',
            'sub_category.required' => 'Sub-category is required',
            'specialization.required' => 'Specialization is required',
            'products_services_description.required' => 'Products / Services Description is required',
        ];
    }
}
