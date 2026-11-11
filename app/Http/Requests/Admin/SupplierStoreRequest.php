<?php

namespace App\Http\Requests\Admin;

use App\Models\User;

class SupplierStoreRequest extends SupplierUpdateRequest
{
    /**
     * Reuse the supplier update rules, requiring an email that is not already
     * linked to a user account, and accepting the registration declaration.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return self::createRules();
    }

    /**
     * @return array<string, mixed>
     */
    public static function createRules(): array
    {
        return array_merge(SupplierUpdateRequest::updateRules(), [
            'tin' => ['required', 'string', 'max:50'],
            'primary_email' => ['required', 'email', 'max:255', 'unique:'.User::class.',email'],
            'declaration_confirmed' => ['boolean'],
        ]);
    }

    public function messages(): array
    {
        return self::createMessages();
    }

    /**
     * @return array<string, string>
     */
    public static function createMessages(): array
    {
        return array_merge(SupplierUpdateRequest::updateMessages(), [
            'tin.required' => 'TIN is required',
            'primary_email.unique' => 'A user account already exists for this email address.',
        ]);
    }
}
