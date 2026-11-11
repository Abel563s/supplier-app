<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class SubmissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'declaration_confirmed' => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'declaration_confirmed.required' => 'Declaration confirmation is required',
        ];
    }
}
