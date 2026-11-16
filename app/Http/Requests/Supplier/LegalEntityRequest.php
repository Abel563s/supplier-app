<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\EthiopianCalendar;

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
            'trade_license_calendar_type' => ['required', 'string', 'in:gregorian,ethiopian'],
            'trade_license_date_original' => ['nullable', 'string'],
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
            'trade_license_calendar_type.required' => 'Calendar type is required',
            'trade_license_calendar_type.in' => 'Calendar type must be either Gregorian or Ethiopian',
            'tax_clearance_from.required' => 'Tax Clearance From is required',
            'tax_clearance_to.required' => 'Tax Clearance To is required',
        ];
    }

    /**
     * Prepare data for validation: convert Ethiopian date to Gregorian for storage.
     */
    protected function prepareForValidation(): void
    {
        $calendarType = $this->input('trade_license_calendar_type');
        $dateOriginal = $this->input('trade_license_date_original');

        if ($calendarType === 'ethiopian' && $dateOriginal) {
            $parts = explode('-', $dateOriginal);
            if (count($parts) === 3) {
                $gregorian = EthiopianCalendar::ethiopianToGregorian(
                    (int) $parts[0],
                    (int) $parts[1],
                    (int) $parts[2]
                );
                $this->merge(['trade_license_renewed_date' => $gregorian]);
            }
        }
    }

    /**
     * Add custom validation for Ethiopian calendar dates.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $calendarType = $this->input('trade_license_calendar_type');
            $dateOriginal = $this->input('trade_license_date_original');

            if ($calendarType === 'ethiopian' && $dateOriginal) {
                $parts = explode('-', $dateOriginal);
                if (count($parts) !== 3) {
                    $validator->errors()->add('trade_license_date_original', 'Invalid Ethiopian date format.');
                    return;
                }

                $validation = EthiopianCalendar::validate(
                    (int) $parts[0],
                    (int) $parts[1],
                    (int) $parts[2]
                );

                if (! $validation['valid']) {
                    $validator->errors()->add('trade_license_date_original', $validation['error'] ?? 'Invalid Ethiopian date.');
                }
            }

            // Validate that the Gregorian date matches when converting from Ethiopian
            if ($calendarType === 'ethiopian' && $dateOriginal && $this->input('trade_license_renewed_date')) {
                $parts = explode('-', $dateOriginal);
                if (count($parts) === 3) {
                    $expectedGregorian = EthiopianCalendar::ethiopianToGregorian(
                        (int) $parts[0],
                        (int) $parts[1],
                        (int) $parts[2]
                    );
                    if ($expectedGregorian !== $this->input('trade_license_renewed_date')) {
                        $validator->errors()->add('trade_license_renewed_date', 'Gregorian date does not match the Ethiopian calendar conversion.');
                    }
                }
            }
        });
    }
}
