<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class ContactLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_contact_name' => ['required', 'string', 'max:255'],
            'primary_phone' => ['required', 'string', 'max:50'],
            'alternate_phone' => ['required', 'string', 'max:50'],
            'primary_email' => ['required', 'email', 'max:255'],
            'alternate_email' => ['nullable', 'email', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'subcity' => ['required', 'string', 'max:100'],
            'woreda' => ['required', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'primary_contact_name.required' => 'Primary Contact Full Name is required',
            'primary_phone.required' => 'License Contact Number is required',
            'alternate_phone.required' => 'Alternate / Sales Contact Number is required',
            'primary_email.required' => 'Email is required',
            'primary_email.email' => 'Please provide a valid email address',
            'city.required' => 'City is required',
            'subcity.required' => 'Subcity is required',
            'woreda.required' => 'Woreda is required',
        ];
    }
}
